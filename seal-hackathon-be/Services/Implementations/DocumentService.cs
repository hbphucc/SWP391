using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Document;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class DocumentService : IDocumentService
    {
        public const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

        private readonly ApplicationDbContext _context;

        public DocumentService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Narrows <paramref name="query"/> to the documents this caller may see, and
        /// returns the round metadata used to decorate prompt documents.
        ///
        /// Both the listing and the download endpoint go through here. Download used
        /// to skip it entirely, so any signed-in user could pull any document by id —
        /// the scoping below was only ever decorating the list.
        /// </summary>
        private async Task<(IQueryable<Document> Query, Dictionary<Guid, (Guid EventId, string EventName, string RoundName)> PromptRounds)>
            ScopeToViewerAsync(IQueryable<Document> query, Guid? currentUserId, IList<string> roles)
        {
            var promptDocumentRounds = new Dictionary<Guid, (Guid EventId, string EventName, string RoundName)>();

            if (!roles.Contains("Admin") && currentUserId.HasValue)
            {
                if (roles.Contains("Mentor") || roles.Contains("Judge"))
                {
                    var participatedEventIds = await _context.Events
                        .Where(e => e.RegisteredMentors.Any(m => m.Id == currentUserId) || e.RegisteredJudges.Any(j => j.Id == currentUserId))
                        .Select(e => e.EventId)
                        .ToListAsync();

                    var adminRoleId = await _context.Roles.Where(r => r.Name == "Admin").Select(r => r.Id).FirstOrDefaultAsync();
                    var adminUserIds = await _context.UserRoles.Where(ur => ur.RoleId == adminRoleId).Select(ur => ur.UserId).ToListAsync();

                    var mentoredTeamIds = await _context.MentorAssignments
                        .Where(ma => ma.MentorUserId == currentUserId && ma.IsActive)
                        .Select(ma => ma.TeamId)
                        .ToListAsync();

                    var mentoredTeamMemberIds = await _context.TeamMembers
                        .Where(tm => mentoredTeamIds.Contains(tm.TeamId))
                        .Select(tm => tm.UserId)
                        .ToListAsync();

                    var mentorChatDocIds = await _context.TeamChatMessages
                        .Where(m => mentoredTeamIds.Contains(m.TeamId) && m.DocumentId != null)
                        .Select(m => m.DocumentId!.Value)
                        .ToListAsync();

                    promptDocumentRounds = await _context.Rounds
                        .AsNoTracking()
                        .Include(r => r.Event)
                        .Where(r =>
                            r.PromptDocumentId.HasValue &&
                            participatedEventIds.Contains(r.EventId))
                        .GroupBy(r => r.PromptDocumentId!.Value)
                        .Select(g => new
                        {
                            DocumentId = g.Key,
                            Round = g
                                .OrderBy(r => r.RoundOrder)
                                .Select(r => new
                                {
                                    r.EventId,
                                    EventName = r.Event.EventName,
                                    r.RoundName
                                })
                                .First()
                        })
                        .ToDictionaryAsync(
                            item => item.DocumentId,
                            item => (item.Round.EventId, item.Round.EventName, item.Round.RoundName));

                    var promptDocumentIds = promptDocumentRounds.Keys.ToList();

                    query = query.Where(d =>
                        d.UploaderId == currentUserId ||
                        (d.EventId == null && d.UploaderId.HasValue && adminUserIds.Contains(d.UploaderId.Value)) ||
                        // Event resources. Chat attachments are excluded here because
                        // TeamChatService stamps them with the team's EventId, which
                        // would otherwise expose one team's private chat to every
                        // mentor and judge registered for that event. They stay
                        // reachable through the chat-specific clause below.
                        (d.EventId != null
                            && participatedEventIds.Contains(d.EventId.Value)
                            && !_context.TeamChatMessages.Any(m => m.DocumentId == d.DocumentId)) ||
                        promptDocumentIds.Contains(d.DocumentId) ||
                        mentorChatDocIds.Contains(d.DocumentId) ||
                        (d.UploaderId.HasValue && mentoredTeamMemberIds.Contains(d.UploaderId.Value))
                    );
                }
                else
                {
                    var myTeamIds = await _context.TeamMembers
                        .Where(tm => tm.UserId == currentUserId)
                        .Select(tm => tm.TeamId)
                        .ToListAsync();

                    var teamMemberIds = await _context.TeamMembers
                        .Where(tm => myTeamIds.Contains(tm.TeamId))
                        .Select(tm => tm.UserId)
                        .ToListAsync();

                    teamMemberIds.Add(currentUserId.Value);

                    var chatDocIds = await _context.TeamChatMessages
                        .Where(m => myTeamIds.Contains(m.TeamId) && m.DocumentId != null)
                        .Select(m => m.DocumentId!.Value)
                        .ToListAsync();

                    query = query.Where(d => (d.UploaderId != null && teamMemberIds.Contains(d.UploaderId.Value)) || chatDocIds.Contains(d.DocumentId));
                }
            }

            return (query, promptDocumentRounds);
        }

        public async Task<ServiceResult> GetDocumentsAsync(Guid? currentUserId, IList<string> roles)
        {
            var (query, promptDocumentRounds) = await ScopeToViewerAsync(
                _context.Documents.AsNoTracking()
                    .Include(d => d.Uploader)
                    .Include(d => d.Event)
                    .AsQueryable(),
                currentUserId,
                roles);

            var documents = await query
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new DocumentDto
                {
                    DocumentId = d.DocumentId,
                    FileName = d.FileName,
                    ContentType = d.ContentType,
                    Size = d.Size,
                    UploaderName = d.Uploader != null ? d.Uploader.FullName : null,
                    EventId = d.EventId,
                    EventName = d.Event != null ? d.Event.EventName : null,
                    TeamId = _context.TeamMembers.Where(tm => tm.UserId == d.UploaderId).Select(tm => (Guid?)tm.TeamId).FirstOrDefault(),
                    TeamName = _context.TeamMembers.Where(tm => tm.UserId == d.UploaderId).Select(tm => tm.Team.TeamName).FirstOrDefault(),
                    UploadedAt = d.UploadedAt
                })
                .ToListAsync();

            foreach (var document in documents)
            {
                if (promptDocumentRounds.TryGetValue(document.DocumentId, out var promptRound))
                {
                    document.EventId = promptRound.EventId;
                    document.EventName = promptRound.EventName;
                    document.RoundName = promptRound.RoundName;
                    document.IsPromptDocument = true;
                }
            }

            return ServiceResult.Ok(documents);
        }

        public async Task<ServiceResult> UploadAsync(Guid? uploaderId, Guid? eventId, string fileName, string? contentType, long length, Stream content)
        {
            if (length <= 0)
                return ServiceResult.BadRequest("No file uploaded.");

            if (length > MaxFileSize)
                return ServiceResult.BadRequest("File exceeds the 10 MB limit.");

            using var ms = new MemoryStream();
            await content.CopyToAsync(ms);
            var bytes = ms.ToArray();

            // Checked against the bytes, not the caller's Content-Type header, which
            // the browser supplies and an attacker controls outright.
            var rejection = UploadedFileValidator.Validate(
                fileName,
                bytes.AsSpan(0, Math.Min(bytes.Length, UploadedFileValidator.SignatureProbeBytes)));

            if (rejection != null)
                return ServiceResult.BadRequest(rejection);

            var document = new Document
            {
                FileName = Path.GetFileName(fileName),
                ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
                Size = length,
                Content = bytes,
                UploaderId = uploaderId,
                EventId = eventId
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new DocumentDto
            {
                DocumentId = document.DocumentId,
                FileName = document.FileName,
                ContentType = document.ContentType,
                Size = document.Size,
                UploadedAt = document.UploadedAt
            });
        }

        public async Task<DocumentDownload?> GetDownloadAsync(Guid id, Guid? currentUserId, IList<string> roles)
        {
            // Same scope as the listing: a document the caller cannot see is
            // reported as missing rather than served, so knowing an id is not by
            // itself permission to read it.
            var (query, _) = await ScopeToViewerAsync(
                _context.Documents.AsNoTracking().AsQueryable(),
                currentUserId,
                roles);

            var document = await query.FirstOrDefaultAsync(d => d.DocumentId == id);

            if (document == null) return null;

            return new DocumentDownload(document.Content, document.ContentType, document.FileName);
        }

        public async Task<ServiceResult> DeleteAsync(Guid id, Guid? currentUserId, bool isAdmin)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.DocumentId == id);
            if (document == null) return ServiceResult.NotFound("Document not found.");

            if (!isAdmin && document.UploaderId != currentUserId)
                return ServiceResult.Forbidden();

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();
            return ServiceResult.OkMessage("Document deleted successfully.");
        }

        public async Task<ServiceResult> GetStorageStatsAsync()
        {
            var docs = await _context.Documents.AsNoTracking()
                .Select(d => new { d.Size, d.ContentType, d.FileName })
                .ToListAsync();

            long totalSize = docs.Sum(d => d.Size);
            int totalCount = docs.Count;
            long quotaBytes = 250 * 1024 * 1024; // 250 MB total quota

            var categories = new Dictionary<string, long>
            {
                { "Images", 0 },
                { "PDFs", 0 },
                { "Archives", 0 },
                { "Code & Text", 0 },
                { "Others", 0 }
            };

            foreach (var doc in docs)
            {
                var ct = doc.ContentType.ToLower();
                var ext = Path.GetExtension(doc.FileName).ToLower();

                if (ct.StartsWith("image/") || ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif")
                {
                    categories["Images"] += doc.Size;
                }
                else if (ct == "application/pdf" || ext == ".pdf")
                {
                    categories["PDFs"] += doc.Size;
                }
                else if (ct.Contains("zip") || ct.Contains("compressed") || ext == ".zip" || ext == ".rar" || ext == ".7z")
                {
                    categories["Archives"] += doc.Size;
                }
                else if (ct.StartsWith("text/") || ct.Contains("javascript") || ct.Contains("json") || ext == ".json" || ext == ".txt" || ext == ".cs" || ext == ".js")
                {
                    categories["Code & Text"] += doc.Size;
                }
                else
                {
                    categories["Others"] += doc.Size;
                }
            }

            var categoryList = categories.Select(kv => new
            {
                name = kv.Key,
                size = kv.Value,
                percentage = totalSize > 0 ? (double)kv.Value / totalSize * 100 : 0
            }).ToList();

            return ServiceResult.Ok(new
            {
                totalSize,
                totalCount,
                quotaBytes,
                usedPercentage = (double)totalSize / quotaBytes * 100,
                categories = categoryList
            });
        }
    }
}
