using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Models.Entities;
using SEAL.NET.Repositories.Interfaces;

namespace SEAL.NET.Repositories.Implementations
{
    public class EventRepository : GenericRepository<Event>, IEventRepository
    {
        public EventRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<List<Event>> GetEventsWithDetailsAsync()
        {
            return await _context.Events
                .AsNoTracking()
                .Include(e => e.Categories)
                    .ThenInclude(c => c.Teams)
                .Include(e => e.Rounds)
                    .ThenInclude(r => r.Submissions)
                .Include(e => e.Rounds)
                    .ThenInclude(r => r.PromptDocument)
                .AsSplitQuery()
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();
        }

        public async Task<Event?> GetEventDetailAsync(Guid eventId)
        {
            return await _context.Events
                .Include(e => e.Categories)
                    .ThenInclude(c => c.Teams)
                .Include(e => e.Rounds)
                    .ThenInclude(r => r.Submissions)
                .Include(e => e.Rounds)
                    .ThenInclude(r => r.PromptDocument)
                .AsSplitQuery()
                .FirstOrDefaultAsync(e => e.EventId == eventId);
        }

        public Task<bool> HasSubmissionsAsync(Guid eventId)
        {
            return _context.Submissions.AnyAsync(s => s.Round != null && s.Round.EventId == eventId);
        }

        public async Task HardDeleteAsync(Guid eventId)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                // Callers reach here after loading the event with its categories and
                // rounds, and every delete below goes straight to the database without
                // telling the change tracker. Those tracked children would still look
                // alive, so removing the event at the end would cascade onto them and
                // issue deletes for rows that are already gone — which EF reports as a
                // concurrency failure. Dropping them first also gives a retry a clean
                // slate, since the strategy replays this whole block.
                _context.ChangeTracker.Clear();

                await using var transaction = await _context.Database.BeginTransactionAsync();

                // 1. Delete Scores
                await _context.Scores
                    .Where(s => (s.Submission != null && s.Submission.Round != null && s.Submission.Round.EventId == eventId)
                        || (s.Submission != null && s.Submission.Team != null && s.Submission.Team.Category != null && s.Submission.Team.Category.EventId == eventId)
                        || (s.Criteria != null && s.Criteria.Round != null && s.Criteria.Round.EventId == eventId))
                    .ExecuteDeleteAsync();

                // 2. Delete JudgeAssignments
                await _context.JudgeAssignments
                    .Where(j => (j.Round != null && j.Round.EventId == eventId)
                        || (j.Category != null && j.Category.EventId == eventId)
                        || (j.Team != null && j.Team.Category != null && j.Team.Category.EventId == eventId))
                    .ExecuteDeleteAsync();

                // 3. Delete Submissions
                await _context.Submissions
                    .Where(s => (s.Round != null && s.Round.EventId == eventId)
                        || (s.Team != null && s.Team.Category != null && s.Team.Category.EventId == eventId))
                    .ExecuteDeleteAsync();

                // 4. Delete TeamChatMessages
                await _context.TeamChatMessages
                    .Where(m => m.Team != null && m.Team.Category != null && m.Team.Category.EventId == eventId)
                    .ExecuteDeleteAsync();

                // 5. Delete RoundStaffAssignments
                await _context.RoundStaffAssignments
                    .Where(r => r.Round != null && r.Round.EventId == eventId)
                    .ExecuteDeleteAsync();

                // 6. Delete Criteria
                await _context.Criteria
                    .Where(c => c.Round != null && c.Round.EventId == eventId)
                    .ExecuteDeleteAsync();

                // 7. Delete KickRequests, MentorAssignments, TeamInvitations, TeamMembers
                await _context.KickRequests
                    .Where(k => k.Team != null && k.Team.Category != null && k.Team.Category.EventId == eventId)
                    .ExecuteDeleteAsync();

                await _context.MentorAssignments
                    .Where(m => (m.Team != null && m.Team.Category != null && m.Team.Category.EventId == eventId)
                        || (m.Round != null && m.Round.EventId == eventId))
                    .ExecuteDeleteAsync();

                await _context.TeamInvitations
                    .Where(i => i.Team != null && i.Team.Category != null && i.Team.Category.EventId == eventId)
                    .ExecuteDeleteAsync();

                await _context.TeamMembers
                    .Where(m => m.Team != null && m.Team.Category != null && m.Team.Category.EventId == eventId)
                    .ExecuteDeleteAsync();

                // 8. Clear CurrentRoundId on Teams before deleting Rounds/Teams
                await _context.Teams
                    .Where(t => (t.CurrentRound != null && t.CurrentRound.EventId == eventId)
                        || (t.Category != null && t.Category.EventId == eventId))
                    .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.CurrentRoundId, (Guid?)null));

                // 9. Delete Teams
                await _context.Teams
                    .Where(t => t.Category != null && t.Category.EventId == eventId)
                    .ExecuteDeleteAsync();

                // 10. Delete Prizes, Categories, Rounds
                await _context.Prizes.Where(p => p.EventId == eventId).ExecuteDeleteAsync();
                await _context.Categories.Where(c => c.EventId == eventId).ExecuteDeleteAsync();
                await _context.Rounds.Where(r => r.EventId == eventId).ExecuteDeleteAsync();

                // 11. Clear join tables (RegisteredMentors / RegisteredJudges) and remove Event
                var eventItem = await _context.Events
                    .Include(e => e.RegisteredMentors)
                    .Include(e => e.RegisteredJudges)
                    .FirstOrDefaultAsync(e => e.EventId == eventId);

                if (eventItem != null)
                {
                    eventItem.RegisteredMentors.Clear();
                    eventItem.RegisteredJudges.Clear();
                    await _context.SaveChangesAsync();

                    _context.Events.Remove(eventItem);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
            });
        }
    }
}
