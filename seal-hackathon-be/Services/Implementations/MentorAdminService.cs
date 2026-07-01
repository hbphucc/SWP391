using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
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

        public async Task<ServiceResult> GetAssignmentsAsync()
        {
            var assignments = await _context.MentorAssignments
                .Include(ma => ma.Mentor)
                .Include(ma => ma.Team)
                .Include(ma => ma.AssignedBy)
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

        // Creating assignments is now leader-initiated (invite) + mentor-accepted —
        // see TeamService.AssignMentorToMyTeamAsync / AcceptMentorInvitationAsync.
        // Admin retains only the ability to view and forcibly remove an assignment.
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
