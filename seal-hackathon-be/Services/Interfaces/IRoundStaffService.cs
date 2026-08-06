using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface IRoundStaffService
    {
        Task<ServiceResult> GetAssignmentsAsync(Guid eventId);
        Task<ServiceResult> AssignAsync(Guid? adminUserId, Guid userId, Guid roundId, RoundStaffRole role);
        Task<ServiceResult> DeactivateAsync(Guid id);
    }
}
