using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Document;
using SEAL.NET.DTOs.TeamChat;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class TeamChatService : ITeamChatService
    {
        private readonly ApplicationDbContext _context;
        private readonly IDocumentService _documentService;

        public TeamChatService(ApplicationDbContext context, IDocumentService documentService)
        {
            _context = context;
            _documentService = documentService;
        }

        private async Task<(bool IsAuthorized, string RoleName)> CheckPermissionAndRoleAsync(Guid teamId, Guid? currentUserId, IList<string> roles)
        {
            if (!currentUserId.HasValue) return (false, string.Empty);
            if (roles.Contains("Admin")) return (true, "Admin");

            var isMentor = await _context.MentorAssignments
                .AnyAsync(ma => ma.TeamId == teamId && ma.MentorUserId == currentUserId.Value && ma.IsActive);
            if (isMentor) return (true, "Mentor");

            var teamMember = await _context.TeamMembers
                .AsNoTracking()
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == currentUserId.Value);
            if (teamMember != null) return (true, teamMember.Role ?? "Member");

            return (false, string.Empty);
        }

        /// <summary>Newest messages returned when the caller does not ask for a size.</summary>
        public const int DefaultPageSize = 50;

        /// <summary>Ceiling on a caller-supplied size, mirroring the cap used for admin lists.</summary>
        public const int MaxPageSize = 200;

        public async Task<ServiceResult> GetMessagesAsync(
            Guid teamId,
            Guid? currentUserId,
            IList<string> roles,
            int? pageSize = null,
            DateTime? before = null)
        {
            var teamExists = await _context.Teams.AnyAsync(t => t.TeamId == teamId);
            if (!teamExists) return ServiceResult.NotFound("Team not found.");

            var (isAuthorized, _) = await CheckPermissionAndRoleAsync(teamId, currentUserId, roles);
            if (!isAuthorized) return ServiceResult.Forbidden();

            var take = Math.Clamp(pageSize ?? DefaultPageSize, 1, MaxPageSize);

            // A chat only grows, so returning the whole history got heavier every
            // day. Take the newest slice (optionally older than `before`, which is
            // how the client walks backwards), then flip it so callers still get
            // messages oldest-first as they always have.
            var page = await _context.TeamChatMessages
                .AsNoTracking()
                .Include(m => m.AttachedDocument)
                .Where(m => m.TeamId == teamId && (before == null || m.SentAt < before))
                .OrderByDescending(m => m.SentAt)
                .Take(take)
                .Select(m => new TeamChatMessageDto(
                    m.Id,
                    m.TeamId,
                    m.SenderId,
                    m.SenderName,
                    m.SenderRole,
                    m.Message,
                    m.DocumentId,
                    m.AttachedDocument != null ? m.AttachedDocument.FileName : null,
                    m.AttachedDocument != null ? (long?)m.AttachedDocument.Size : null,
                    m.SentAt
                ))
                .ToListAsync();

            page.Reverse();
            return ServiceResult.Ok(page);
        }

        public async Task<ServiceResult> SendMessageAsync(Guid teamId, Guid? currentUserId, IList<string> roles, string? message, IFormFile? file)
        {
            if (!currentUserId.HasValue) return ServiceResult.Unauthorized("User not authenticated.");
            if (string.IsNullOrWhiteSpace(message) && (file == null || file.Length == 0))
                return ServiceResult.BadRequest("Message or file attachment is required.");

            var team = await _context.Teams
                .Include(t => t.Category)
                    .ThenInclude(c => c!.Event)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null) return ServiceResult.NotFound("Team not found.");

            var eventStatus = team.Category?.Event?.Status;
            if (eventStatus == EventStatus.Completed || eventStatus == EventStatus.Cancelled)
            {
                return ServiceResult.BadRequest("Chat is disabled because this event has ended.");
            }

            var (isAuthorized, roleName) = await CheckPermissionAndRoleAsync(teamId, currentUserId, roles);
            if (!isAuthorized) return ServiceResult.Forbidden();

            var sender = await _context.Users.FindAsync(currentUserId.Value);
            var senderName = sender?.FullName ?? sender?.UserName ?? "Unknown User";

            Guid? documentId = null;
            string? documentName = null;
            long? documentSize = null;

            if (file != null && file.Length > 0)
            {
                using var stream = file.OpenReadStream();
                var uploadResult = await _documentService.UploadAsync(
                    currentUserId,
                    team.Category?.EventId,
                    file.FileName,
                    file.ContentType,
                    file.Length,
                    stream
                );

                if (uploadResult.Outcome != ServiceOutcome.Ok)
                    return uploadResult;

                var docDto = uploadResult.Body as DocumentDto;
                if (docDto != null)
                {
                    documentId = docDto.DocumentId;
                    documentName = docDto.FileName;
                    documentSize = docDto.Size;
                }
            }

            var chatMsg = new TeamChatMessage
            {
                TeamId = teamId,
                SenderId = currentUserId.Value,
                SenderName = senderName,
                SenderRole = roleName,
                Message = message?.Trim() ?? string.Empty,
                DocumentId = documentId,
                SentAt = DateTime.UtcNow
            };

            _context.TeamChatMessages.Add(chatMsg);
            await _context.SaveChangesAsync();

            var dto = new TeamChatMessageDto(
                chatMsg.Id,
                chatMsg.TeamId,
                chatMsg.SenderId,
                chatMsg.SenderName,
                chatMsg.SenderRole,
                chatMsg.Message,
                documentId,
                documentName,
                documentSize,
                chatMsg.SentAt
            );

            return ServiceResult.Ok(dto);
        }
    }
}
