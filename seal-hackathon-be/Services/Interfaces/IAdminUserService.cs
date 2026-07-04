using SEAL.NET.DTOs.User;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface IAdminUserService
    {
        Task<ServiceResult> GetUsersAsync(int page, int pageSize);
        Task<ServiceResult> GetPendingUsersAsync(int page, int pageSize);
        Task<ServiceResult> ApproveUserAsync(Guid? actorUserId, Guid userId);
        Task<ServiceResult> RejectUserAsync(Guid? actorUserId, Guid userId);
        Task<ServiceResult> UpdateUserRoleAsync(Guid? actorUserId, Guid userId, UpdateUserRoleRequest request);
        Task<ServiceResult> DeleteUserAsync(Guid userId);
        Task<ServiceResult> CreateGuestJudgeAsync(Guid? actorUserId, CreateGuestJudgeRequest request);
        Task<ServiceResult> GetRoleRequestsAsync();
        Task<ServiceResult> HandleRoleRequestAsync(Guid? actorUserId, Guid userId, bool approve);
        Task<ServiceResult> GetRegisteredMentorsAsync(Guid eventId);
        Task<ServiceResult> GetRegisteredJudgesAsync(Guid eventId);
    }
}
