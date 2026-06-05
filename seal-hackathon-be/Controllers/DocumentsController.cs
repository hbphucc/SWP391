using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Document;
using SEAL.NET.Models.Entities;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB
        private readonly ApplicationDbContext _context;

        public DocumentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private Guid? TryGetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetDocuments()
        {
            var documents = await _context.Documents.AsNoTracking()
                .Include(d => d.Uploader)
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new DocumentDto
                {
                    DocumentId = d.DocumentId,
                    FileName = d.FileName,
                    ContentType = d.ContentType,
                    Size = d.Size,
                    UploaderName = d.Uploader != null ? d.Uploader.FullName : null,
                    UploadedAt = d.UploadedAt
                })
                .ToListAsync();

            return Ok(documents);
        }

        [HttpPost]
        [RequestSizeLimit(MaxFileSize)]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            if (file.Length > MaxFileSize)
                return BadRequest(new { message = "File exceeds the 10 MB limit." });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            var document = new Document
            {
                FileName = Path.GetFileName(file.FileName),
                ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
                Size = file.Length,
                Content = ms.ToArray(),
                UploaderId = TryGetCurrentUserId()
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new DocumentDto
            {
                DocumentId = document.DocumentId,
                FileName = document.FileName,
                ContentType = document.ContentType,
                Size = document.Size,
                UploadedAt = document.UploadedAt
            });
        }

        [HttpGet("{id:guid}/download")]
        public async Task<IActionResult> Download(Guid id)
        {
            var document = await _context.Documents.AsNoTracking()
                .FirstOrDefaultAsync(d => d.DocumentId == id);

            if (document == null) return NotFound(new { message = "Document not found." });

            return File(document.Content, document.ContentType, document.FileName);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var document = await _context.Documents.FirstOrDefaultAsync(d => d.DocumentId == id);
            if (document == null) return NotFound(new { message = "Document not found." });

            var userId = TryGetCurrentUserId();
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && document.UploaderId != userId)
                return Forbid();

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Document deleted successfully." });
        }
    }
}
