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
                .Include(e => e.Categories)
                    .ThenInclude(c => c.Teams)
                .Include(e => e.Rounds)
                    .ThenInclude(r => r.Submissions)
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
                .FirstOrDefaultAsync(e => e.EventId == eventId);
        }

        public Task<bool> HasSubmissionsAsync(Guid eventId)
        {
            return _context.Submissions.AnyAsync(s => s.Round.EventId == eventId);
        }

        public async Task HardDeleteAsync(Guid eventId)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            await _context.Scores
                .Where(s => s.Submission!.Round.EventId == eventId
                    || s.Submission.Team.Category.EventId == eventId
                    || s.Criteria!.Round.EventId == eventId)
                .ExecuteDeleteAsync();

            await _context.JudgeAssignments
                .Where(j => j.Round.EventId == eventId
                    || j.Category.EventId == eventId
                    || (j.Team != null && j.Team.Category.EventId == eventId))
                .ExecuteDeleteAsync();

            await _context.Submissions
                .Where(s => s.Round.EventId == eventId || s.Team.Category.EventId == eventId)
                .ExecuteDeleteAsync();

            await _context.Criteria
                .Where(c => c.Round.EventId == eventId)
                .ExecuteDeleteAsync();

            await _context.KickRequests
                .Where(k => k.Team.Category.EventId == eventId)
                .ExecuteDeleteAsync();
            await _context.MentorAssignments
                .Where(m => m.Team.Category.EventId == eventId)
                .ExecuteDeleteAsync();
            await _context.TeamInvitations
                .Where(i => i.Team.Category.EventId == eventId)
                .ExecuteDeleteAsync();
            await _context.TeamMembers
                .Where(m => m.Team.Category.EventId == eventId)
                .ExecuteDeleteAsync();

            await _context.Teams
                .Where(t => t.CurrentRound != null && t.CurrentRound.EventId == eventId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.CurrentRoundId, (Guid?)null));
            await _context.Teams
                .Where(t => t.Category.EventId == eventId)
                .ExecuteDeleteAsync();

            await _context.Prizes.Where(p => p.EventId == eventId).ExecuteDeleteAsync();
            await _context.Categories.Where(c => c.EventId == eventId).ExecuteDeleteAsync();
            await _context.Rounds.Where(r => r.EventId == eventId).ExecuteDeleteAsync();
            await _context.Events.Where(e => e.EventId == eventId).ExecuteDeleteAsync();

            await transaction.CommitAsync();
        }
    }
}
