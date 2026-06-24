using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>
    /// Read-only aggregation for the judge's own dashboard and assigned-teams view.
    /// All data is scoped to the authenticated judge's <c>JudgeAssignment</c>s.
    /// </summary>
    public interface IJudgeDashboardService
    {
        Task<ServiceResult> GetDashboardAsync(Guid judgeId);

        /// <summary>
        /// Assigned teams with submission + scoring status. Optional filters are
        /// applied server-side; all are case-insensitive where relevant.
        /// </summary>
        Task<ServiceResult> GetAssignedTeamsAsync(
            Guid judgeId,
            Guid? eventId,
            Guid? roundId,
            string? status,
            string? search);
    }
}
