using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Judge;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class JudgeAssignmentService : IJudgeAssignmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;

        public JudgeAssignmentService(
            ApplicationDbContext context, 
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService)
        {
            _context = context;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        public async Task<ServiceResult> GetAssignmentsAsync(Guid? eventId, Guid? roundId)
        {
            var query = _context.JudgeAssignments
                .Include(a => a.Judge)
                .Include(a => a.Round)
                .Include(a => a.Category)
                .Include(a => a.Team)
                .AsQueryable();

            if (eventId.HasValue)
                query = query.Where(a => a.Round.EventId == eventId.Value);
            if (roundId.HasValue)
                query = query.Where(a => a.RoundId == roundId.Value);

            var rawAssignments = await query.ToListAsync();

            var grouped = rawAssignments
                .GroupBy(a => new { a.JudgeId, a.RoundId, a.CategoryId })
                .Select(g => {
                    var first = g.First();
                    // If any assignment in the group has a TeamId, we select those specific teams
                    var assignedTeams = g.Where(a => a.Team != null).Select(a => new { a.Team!.TeamId, a.Team.TeamName }).ToList();
                    
                    return new
                    {
                        AssignmentId = first.AssignmentId,
                        AssignmentIds = g.Select(a => a.AssignmentId).ToList(),
                        IsCategoryWide = !assignedTeams.Any(),
                        judge = new
                        {
                            first.JudgeId,
                            first.Judge!.FullName,
                            first.Judge.Email
                        },
                        round = new
                        {
                            first.RoundId,
                            first.Round!.RoundName
                        },
                        category = new
                        {
                            first.CategoryId,
                            first.Category!.CategoryName,
                            // If assigned to specific teams, show them. Otherwise show all teams in the category.
                            Teams = assignedTeams.Any() 
                                ? assignedTeams 
                                : _context.Teams.Where(t => t.CategoryId == first.CategoryId).Select(t => new { t.TeamId, t.TeamName }).ToList()
                        }
                    };
                })
                .ToList();

            return ServiceResult.Ok(grouped);
        }

        public async Task<ServiceResult> CreateAssignmentAsync(CreateJudgeAssignmentRequest request)
        {
            var judge = await _userManager.FindByIdAsync(request.JudgeId.ToString());
            if (judge == null)
                return ServiceResult.NotFound("Judge not found.");

            var isJudge = await _userManager.IsInRoleAsync(judge, "Judge");
            if (!isJudge)
                return ServiceResult.BadRequest("This user is not a Judge.");

            var round = await _context.Rounds.FindAsync(request.RoundId);
            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            var category = await _context.Categories.FindAsync(request.CategoryId);
            if (category == null)
                return ServiceResult.NotFound("Category not found.");

            if (round.EventId != category.EventId)
                return ServiceResult.BadRequest("Round and category must belong to the same event.");

            // The judge must have registered for this event (added themselves via the
            // event registration flow). Having the global "Judge" role is necessary but
            // not sufficient — registration is what scopes a judge to an event.
            var isRegistered = await _context.Events
                .Where(e => e.EventId == round.EventId)
                .SelectMany(e => e.RegisteredJudges)
                .AnyAsync(u => u.Id == request.JudgeId);
            if (!isRegistered)
                return ServiceResult.BadRequest("Selected judge has not registered for this event.");

            var isOnRoster = await _context.RoundStaffAssignments.AnyAsync(a =>
                a.UserId == request.JudgeId && a.RoundId == request.RoundId && a.Role == RoundStaffRole.Judge && a.IsActive);
            if (!isOnRoster)
                return ServiceResult.BadRequest("Add this judge to the selected round roster before assigning teams.");

            // Resolve and validate every requested team up front, in ONE query.
            // This must happen before the RemoveRange calls below: those mark the
            // existing assignments as Deleted on the shared scoped DbContext, so a
            // validation failure after that point would leave pending deletes that
            // any later SaveChangesAsync in the same request would flush.
            var requestedTeams = new List<Team>();
            if (request.TeamIds != null && request.TeamIds.Any())
            {
                requestedTeams = await _context.Teams
                    .Where(t => request.TeamIds.Contains(t.TeamId) && t.CurrentRoundId == request.RoundId)
                    .ToListAsync();

                // Cast to Guid? so "no invalid id" is distinguishable from an id that
                // is itself Guid.Empty — FirstOrDefault on Guid returns Guid.Empty for
                // both, which would let an empty id slip through unreported.
                var invalidTeamId = request.TeamIds
                    .Select(id => (Guid?)id)
                    .FirstOrDefault(id => !requestedTeams.Any(t => t.TeamId == id && t.CategoryId == request.CategoryId));

                if (invalidTeamId.HasValue)
                    return ServiceResult.BadRequest($"Team with ID {invalidTeamId.Value} is not in the selected category or is not active in this round.");

                // Caught here as well as at scoring time so the organiser finds out
                // while assigning, not when the judge is blocked mid-review.
                var mentored = await ConflictOfInterest.MentoredTeamsAmongAsync(
                    _context, request.JudgeId, request.TeamIds);

                if (mentored.Count > 0)
                {
                    var names = requestedTeams
                        .Where(t => mentored.Contains(t.TeamId))
                        .Select(t => t.TeamName);

                    return ServiceResult.BadRequest(
                        $"This judge mentors {string.Join(", ", names)} and cannot be assigned to score them.");
                }
            }
            else
            {
                // Category-wide assignment: check if judge mentors any team in this category
                var categoryTeamIds = await _context.Teams
                    .Where(t => t.CategoryId == request.CategoryId && t.CurrentRoundId == request.RoundId)
                    .Select(t => t.TeamId)
                    .ToListAsync();

                if (categoryTeamIds.Any())
                {
                    var mentoredInCategory = await ConflictOfInterest.MentoredTeamsAmongAsync(
                        _context, request.JudgeId, categoryTeamIds);

                    if (mentoredInCategory.Count > 0)
                    {
                        var names = await _context.Teams
                            .Where(t => mentoredInCategory.Contains(t.TeamId))
                            .Select(t => t.TeamName)
                            .ToListAsync();

                        return ServiceResult.BadRequest(
                            $"This judge mentors {string.Join(", ", names)} in this track and cannot be assigned category-wide.");
                    }
                }
            }

            // Remove existing assignments for this specific judge, round, and category combination
            // (to update or replace this judge's assigned teams without overwriting assignments of other judges).
            var existingForJudge = await _context.JudgeAssignments
                .Where(a => a.JudgeId == request.JudgeId && a.RoundId == request.RoundId && a.CategoryId == request.CategoryId)
                .ToListAsync();
            if (existingForJudge.Any())
            {
                _context.JudgeAssignments.RemoveRange(existingForJudge);
            }

            // Create assignments
            if (request.TeamIds != null && request.TeamIds.Any())
            {
                // Iterating the resolved teams (rather than the raw request ids) also
                // collapses duplicate ids into a single assignment per team.
                foreach (var team in requestedTeams)
                {
                    var assignment = new JudgeAssignment
                    {
                        JudgeId = request.JudgeId,
                        RoundId = request.RoundId,
                        CategoryId = request.CategoryId,
                        TeamId = team.TeamId
                    };
                    _context.JudgeAssignments.Add(assignment);
                }

                // Send notification
                string teamNamesStr = string.Join(", ", requestedTeams.Select(t => t.TeamName));
                string notifMessage = $"You have been assigned to manage/grade the following teams in {category.CategoryName} for {round.RoundName}: {teamNamesStr}.";
                await _notificationService.CreateAsync(request.JudgeId, "New Judge Assignment", notifMessage, "info");
            }
            else
            {
                // Category-wide assignment (TeamId is null)
                var assignment = new JudgeAssignment
                {
                    JudgeId = request.JudgeId,
                    RoundId = request.RoundId,
                    CategoryId = request.CategoryId,
                    TeamId = null
                };
                _context.JudgeAssignments.Add(assignment);

                // Send notification
                string notifMessage = $"You have been assigned to manage/grade all teams in {category.CategoryName} for {round.RoundName}.";
                await _notificationService.CreateAsync(request.JudgeId, "New Judge Assignment", notifMessage, "info");
            }

            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = "Judge assigned successfully."
            });
        }

        public async Task<ServiceResult> DeleteAssignmentAsync(Guid assignmentId)
        {
            var assignment = await _context.JudgeAssignments.FindAsync(assignmentId);

            if (assignment == null)
                return ServiceResult.NotFound("Assignment not found.");

            // Remove all assignments in this group (JudgeId, RoundId, CategoryId)
            var group = await _context.JudgeAssignments
                .Where(a => a.JudgeId == assignment.JudgeId && a.RoundId == assignment.RoundId && a.CategoryId == assignment.CategoryId)
                .ToListAsync();

            _context.JudgeAssignments.RemoveRange(group);
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Judge assignment removed successfully.");
        }
    }
}
