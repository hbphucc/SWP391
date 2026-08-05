using Microsoft.AspNetCore.Http;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface ITeamChatService
    {
        Task<ServiceResult> GetMessagesAsync(Guid teamId, Guid? currentUserId, IList<string> roles);
        Task<ServiceResult> SendMessageAsync(Guid teamId, Guid? currentUserId, IList<string> roles, string? message, IFormFile? file);
    }
}
