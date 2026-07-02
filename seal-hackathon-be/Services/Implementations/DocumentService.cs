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

        public async Task<ServiceResult> GetDocumentsAsync(Guid? currentUserId, IList<string> roles)
        {
            var query = _context.Documents.AsNoTracking()
                .Include(d => d.Uploader)
                .Include(d => d.Event)
                .AsQueryable();

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

                    var mentoredTeamMemberIds = await _context.MentorAssignments
                        .Where(ma => ma.MentorUserId == currentUserId && ma.IsActive)
                        .SelectMany(ma => ma.Team.Members.Select(tm => tm.UserId))
                        .ToListAsync();

                    query = query.Where(d =>
                        (d.EventId == null && d.UploaderId.HasValue && adminUserIds.Contains(d.UploaderId.Value)) ||
                        (d.EventId != null && participatedEventIds.Contains(d.EventId.Value)) ||
                        (d.UploaderId.HasValue && mentoredTeamMemberIds.Contains(d.UploaderId.Value))
                    );
                }
                else
                {
                    // Regular users: Only see documents uploaded by their team members
                    var teamMemberIds = await _context.TeamMembers
                        .Where(tm => _context.TeamMembers.Any(myTm => myTm.TeamId == tm.TeamId && myTm.UserId == currentUserId))
                        .Select(tm => tm.UserId)
                        .ToListAsync();

                    teamMemberIds.Add(currentUserId.Value);

                    query = query.Where(d => d.UploaderId != null && teamMemberIds.Contains(d.UploaderId.Value));
                }
            }

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

            var document = new Document
            {
                FileName = Path.GetFileName(fileName),
                ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
                Size = length,
                Content = ms.ToArray(),
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

        public async Task<DocumentDownload?> GetDownloadAsync(Guid id)
        {
            var document = await _context.Documents.AsNoTracking()
                .FirstOrDefaultAsync(d => d.DocumentId == id);

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
