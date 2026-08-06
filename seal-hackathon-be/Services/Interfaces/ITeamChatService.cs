using Microsoft.AspNetCore.Http;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface ITeamChatService
    {
        /// <param name="pageSize">Newest messages to return; defaults to 50, capped at 200.</param>
        /// <param name="before">Return only messages sent before this instant, for paging backwards.</param>
        Task<ServiceResult> GetMessagesAsync(
            Guid teamId,
            Guid? currentUserId,
            IList<string> roles,
            int? pageSize = null,
            DateTime? before = null);
        Task<ServiceResult> SendMessageAsync(Guid teamId, Guid? currentUserId, IList<string> roles, string? message, IFormFile? file);
    }
}
