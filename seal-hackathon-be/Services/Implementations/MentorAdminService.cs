using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class MentorAdminService : IMentorAdminService
    {
        private readonly ApplicationDbContext _context;

        public MentorAdminService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetAssignmentsAsync(Guid? eventId = null)
        {
            var assignments = await _context.MentorAssignments
                .Include(ma => ma.Mentor)
                .Include(ma => ma.Team).ThenInclude(t => t!.Category)
                .Include(ma => ma.Round)
                .Include(ma => ma.AssignedBy)
                // A round-level row has no team yet, so the event has to be reachable
                // through the round as well as through the team.
                .Where(ma => eventId == null
                    || (ma.Team != null && ma.Team.Category.EventId == eventId)
                    || (ma.Round != null && ma.Round.EventId == eventId))
                .OrderByDescending(ma => ma.AssignedAt)
                .Select(ma => new MentorAssignmentResponseDto
                {
                    Id = ma.Id,
                    MentorUserId = ma.MentorUserId,
                    MentorName = ma.Mentor.FullName,
                    MentorEmail = ma.Mentor.Email ?? string.Empty,
                    RoundId = ma.RoundId,
                    RoundName = ma.Round != null ? ma.Round.RoundName : null,
                    TeamId = ma.TeamId,
                    TeamName = ma.Team != null ? ma.Team.TeamName : null,
                    AssignedByName = ma.AssignedBy != null ? ma.AssignedBy.FullName : "System",
                    AssignedAt = ma.AssignedAt,
                    IsActive = ma.IsActive,
                    Status = ma.Status.ToString()
                })
                .ToListAsync();

            return ServiceResult.Ok(assignments);
        }

        /// <summary>
        /// Step one of the two-step allocation: put a mentor on a round. No team is
        /// chosen yet, so this grants nothing on its own — it is the roster the
        /// organiser then draws teams from.
        /// </summary>
        public async Task<ServiceResult> AssignMentorToRoundAsync(Guid? adminUserId, Guid mentorUserId, Guid roundId)
        {
            var round = await _context.Rounds.FirstOrDefaultAsync(r => r.RoundId == roundId);
            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            var mentor = await _context.Users.FirstOrDefaultAsync(u => u.Id == mentorUserId);
            if (mentor == null)
                return ServiceResult.NotFound("Mentor user not found.");

            // Postgres treats NULLs as distinct, so the unique index cannot catch a
            // repeat of the team-less row. Check for it here instead.
            var alreadyOnRound = await _context.MentorAssignments
                .AnyAsync(ma => ma.MentorUserId == mentorUserId
                    && ma.RoundId == roundId
                    && ma.TeamId == null
                    && ma.IsActive);

            if (alreadyOnRound)
                return ServiceResult.BadRequest("This mentor is already assigned to that round.");

            _context.MentorAssignments.Add(new MentorAssignment
            {
                RoundId = roundId,
                TeamId = null,
                MentorUserId = mentorUserId,
                AssignedByUserId = adminUserId,
                Status = InvitationStatus.Accepted,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return ServiceResult.OkMessage("Mentor assigned to round successfully.");
        }

        /// <summary>
        /// Step two: point a mentor already on the round at one of its teams. This is
        /// the row that actually grants access to the team's chat and documents.
        /// </summary>
        public async Task<ServiceResult> AssignMentorAsync(Guid? adminUserId, Guid mentorUserId, Guid roundId, Guid teamId)
        {
            var round = await _context.Rounds.FirstOrDefaultAsync(r => r.RoundId == roundId);
            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            var team = await _context.Teams
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            if (team.Category!.EventId != round.EventId)
                return ServiceResult.BadRequest("That team does not compete in the same event as the round.");

            if (team.CurrentRoundId != roundId)
                return ServiceResult.BadRequest("That team is not active in the selected round.");

            var isOnRoster = await _context.RoundStaffAssignments.AnyAsync(a =>
                a.UserId == mentorUserId && a.RoundId == roundId && a.Role == RoundStaffRole.Mentor && a.IsActive);
            if (!isOnRoster)
                return ServiceResult.BadRequest("Add this mentor to the selected round roster before assigning a team.");

            var mentor = await _context.Users.FirstOrDefaultAsync(u => u.Id == mentorUserId);
            if (mentor == null)
                return ServiceResult.NotFound("Mentor user not found.");

            // One mentor per team per round. An earlier round keeps whatever mentor it
            // had, which is the whole point of scoping these to a round.
            var supersededOnThisRound = await _context.MentorAssignments
                .Where(ma => ma.TeamId == teamId
                    && ma.RoundId == roundId
                    && (ma.IsActive || ma.Status == InvitationStatus.Pending))
                .ToListAsync();

            foreach (var existing in supersededOnThisRound)
            {
                if (existing.MentorUserId == mentorUserId && existing.IsActive)
                    return ServiceResult.OkMessage("That mentor already covers this team in this round.");

                existing.IsActive = false;
                existing.Status = InvitationStatus.Cancelled;
            }

            _context.MentorAssignments.Add(new MentorAssignment
            {
                RoundId = roundId,
                TeamId = teamId,
                MentorUserId = mentorUserId,
                AssignedByUserId = adminUserId,
                Status = InvitationStatus.Accepted,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return ServiceResult.OkMessage("Mentor assigned to team successfully.");
        }


        /// <summary>
        /// Assigns a mentor to a whole Track (Category), which is how the brief
        /// describes mentor allocation.
        ///
        /// This materialises one team-level assignment per team currently in the
        /// category rather than introducing a second kind of assignment record.
        /// Every existing reader — the mentor's team list, chat permissions,
        /// document scoping, the conflict-of-interest check — keeps working off the
        /// one model it already understands.
        ///
        /// It is a snapshot: teams that register for the category afterwards are not
        /// picked up automatically, so the organiser applies it again. The result
        /// message reports how many teams were covered.
        /// </summary>
        public async Task<ServiceResult> AssignMentorToCategoryAsync(Guid? adminUserId, Guid mentorUserId, Guid roundId, Guid categoryId)
        {
            var round = await _context.Rounds.FirstOrDefaultAsync(r => r.RoundId == roundId);
            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            var category = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == categoryId);
            if (category == null)
                return ServiceResult.NotFound("Category not found.");

            if (category.EventId != round.EventId)
                return ServiceResult.BadRequest("That track belongs to a different event than the round.");

            var isOnRoster = await _context.RoundStaffAssignments.AnyAsync(a =>
                a.UserId == mentorUserId && a.RoundId == roundId && a.Role == RoundStaffRole.Mentor && a.IsActive);
            if (!isOnRoster)
                return ServiceResult.BadRequest("Add this mentor to the selected round roster before assigning teams.");

            var mentor = await _context.Users.FirstOrDefaultAsync(u => u.Id == mentorUserId);
            if (mentor == null)
                return ServiceResult.NotFound("Mentor user not found.");

            var teamIds = await _context.Teams
                .Where(t => t.CategoryId == categoryId && t.CurrentRoundId == roundId)
                .Select(t => t.TeamId)
                .ToListAsync();

            if (teamIds.Count == 0)
                return ServiceResult.BadRequest("This category has no teams yet.");

            // A judge already scoring a team in this category must not become its
            // mentor — that is the same conflict, arrived at from the other side.
            var conflicting = await _context.JudgeAssignments
                .Where(a => a.JudgeId == mentorUserId && a.CategoryId == categoryId)
                .AnyAsync();

            if (conflicting)
                return ServiceResult.BadRequest(
                    "This person is assigned to judge in this category and cannot also mentor it.");

            // Scoped to this round: whoever mentored these teams in an earlier round
            // keeps that record, which is the point of scoping them to rounds at all.
            var existing = await _context.MentorAssignments
                .Where(ma => ma.TeamId != null
                    && ma.RoundId == roundId
                    && teamIds.Contains(ma.TeamId.Value)
                    && (ma.IsActive || ma.Status == InvitationStatus.Pending))
                .ToListAsync();

            var added = 0;
            foreach (var teamId in teamIds)
            {
                // Already mentoring this team: leave the record alone rather than
                // cancelling and recreating it.
                if (existing.Any(ma => ma.TeamId == teamId && ma.MentorUserId == mentorUserId && ma.IsActive))
                    continue;

                foreach (var superseded in existing.Where(ma => ma.TeamId == teamId))
                {
                    superseded.IsActive = false;
                    superseded.Status = InvitationStatus.Cancelled;
                }

                _context.MentorAssignments.Add(new MentorAssignment
                {
                    RoundId = roundId,
                    TeamId = teamId,
                    MentorUserId = mentorUserId,
                    AssignedByUserId = adminUserId,
                    Status = InvitationStatus.Accepted,
                    IsActive = true,
                    AssignedAt = DateTime.UtcNow
                });
                added++;
            }

            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = added == 0
                    ? $"Already mentoring every team in {category.CategoryName}."
                    : $"Assigned as mentor to {added} of {teamIds.Count} teams in {category.CategoryName}.",
                teamsCovered = added,
                teamsInCategory = teamIds.Count
            });
        }

        public async Task<ServiceResult> DeactivateAssignmentAsync(Guid id)
        {
            var assignment = await _context.MentorAssignments.FirstOrDefaultAsync(ma => ma.Id == id);
            if (assignment == null)
                return ServiceResult.NotFound("Assignment not found.");

            if (!assignment.IsActive)
                return ServiceResult.BadRequest("Assignment is already inactive.");

            assignment.IsActive = false;
            assignment.Status = InvitationStatus.Cancelled;
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Assignment deactivated successfully.");
        }
    }
}
