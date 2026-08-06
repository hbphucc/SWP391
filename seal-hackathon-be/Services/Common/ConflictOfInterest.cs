using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;

namespace SEAL.NET.Services.Common
{
    /// <summary>
    /// A mentor coaches a team toward the thing being marked, so letting them also
    /// mark it undermines the fairness the whole system exists to provide — and
    /// this project's research question is precisely about scoring fairness.
    ///
    /// One definition, used both when assignments are created and again when a
    /// score is saved. The second check is not redundant: assignments can be
    /// category-wide (JudgeAssignment.TeamId is null), so a judge can legitimately
    /// hold an assignment that happens to cover a team they mentor.
    /// </summary>
    public static class ConflictOfInterest
    {
        /// <summary>True when this user is the acting mentor of this team.</summary>
        public static Task<bool> MentorsTeamAsync(ApplicationDbContext db, Guid userId, Guid teamId)
            => db.MentorAssignments.AnyAsync(ma =>
                ma.MentorUserId == userId &&
                ma.TeamId == teamId &&
                // Pending or rejected invitations do not make someone a mentor.
                ma.IsActive);

        /// <summary>Teams this user mentors, out of the ones given.</summary>
        public static Task<List<Guid>> MentoredTeamsAmongAsync(
            ApplicationDbContext db, Guid userId, IEnumerable<Guid> teamIds)
        {
            var ids = teamIds.ToList();
            return db.MentorAssignments
                .Where(ma => ma.MentorUserId == userId && ma.IsActive && ids.Contains(ma.TeamId))
                .Select(ma => ma.TeamId)
                .Distinct()
                .ToListAsync();
        }
    }
}
