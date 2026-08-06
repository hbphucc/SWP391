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
                .Include(ma => ma.Team).ThenInclude(t => t.Category)
                .Include(ma => ma.AssignedBy)
                .Where(ma => eventId == null || ma.Team.Category.EventId == eventId)
                .OrderByDescending(ma => ma.AssignedAt)
                .Select(ma => new MentorAssignmentResponseDto
                {
                    Id = ma.Id,
                    MentorUserId = ma.MentorUserId,
                    MentorName = ma.Mentor.FullName,
                    MentorEmail = ma.Mentor.Email ?? string.Empty,
                    TeamId = ma.TeamId,
                    TeamName = ma.Team.TeamName,
                    AssignedByName = ma.AssignedBy != null ? ma.AssignedBy.FullName : "System",
                    AssignedAt = ma.AssignedAt,
                    IsActive = ma.IsActive,
                    Status = ma.Status.ToString()
                })
                .ToListAsync();

            return ServiceResult.Ok(assignments);
        }

        public async Task<ServiceResult> AssignMentorAsync(Guid? adminUserId, Guid mentorUserId, Guid teamId)
        {
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            var mentor = await _context.Users.FirstOrDefaultAsync(u => u.Id == mentorUserId);
            if (mentor == null)
                return ServiceResult.NotFound("Mentor user not found.");

            var existingActive = await _context.MentorAssignments
                .Where(ma => ma.TeamId == teamId && (ma.IsActive || ma.Status == InvitationStatus.Pending))
                .ToListAsync();

            foreach (var existing in existingActive)
            {
                existing.IsActive = false;
                existing.Status = InvitationStatus.Cancelled;
            }

            var newAssignment = new MentorAssignment
            {
                TeamId = teamId,
                MentorUserId = mentorUserId,
                AssignedByUserId = adminUserId,
                Status = InvitationStatus.Accepted,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            };

            _context.MentorAssignments.Add(newAssignment);
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
        public async Task<ServiceResult> AssignMentorToCategoryAsync(Guid? adminUserId, Guid mentorUserId, Guid categoryId)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == categoryId);
            if (category == null)
                return ServiceResult.NotFound("Category not found.");

            var mentor = await _context.Users.FirstOrDefaultAsync(u => u.Id == mentorUserId);
            if (mentor == null)
                return ServiceResult.NotFound("Mentor user not found.");

            var teamIds = await _context.Teams
                .Where(t => t.CategoryId == categoryId)
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

            var existing = await _context.MentorAssignments
                .Where(ma => teamIds.Contains(ma.TeamId) && (ma.IsActive || ma.Status == InvitationStatus.Pending))
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
