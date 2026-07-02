using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>
    /// Admin read/remove access over mentor assignments (for <c>AdminMentorsController</c>).
    /// Creating an assignment is leader-invite + mentor-accept only; admin cannot assign.
    /// </summary>
    public interface IMentorAdminService
    {
        Task<ServiceResult> GetAssignmentsAsync(Guid? eventId = null);
        Task<ServiceResult> DeactivateAssignmentAsync(Guid id);
    }
}
