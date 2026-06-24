using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Track;
using SEAL.NET.Models.Entities;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class TrackService : ITrackService
    {
        private readonly ApplicationDbContext _context;

        public TrackService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetTracksAsync(bool activeOnly, string? search)
        {
            var query = _context.Tracks.AsQueryable();

            if (activeOnly)
                query = query.Where(t => t.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(t =>
                    t.Name.ToLower().Contains(q) ||
                    (t.Description != null && t.Description.ToLower().Contains(q)));
            }

            var tracks = await query
                .OrderByDescending(t => t.IsActive)
                .ThenBy(t => t.Name)
                .Select(t => new TrackDto
                {
                    TrackId = t.TrackId,
                    Name = t.Name,
                    Description = t.Description,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    UsageCount = t.Categories.Count
                })
                .ToListAsync();

            return ServiceResult.Ok(tracks);
        }

        public async Task<ServiceResult> GetTrackByIdAsync(Guid trackId)
        {
            var track = await _context.Tracks
                .Where(t => t.TrackId == trackId)
                .Select(t => new TrackDto
                {
                    TrackId = t.TrackId,
                    Name = t.Name,
                    Description = t.Description,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    UsageCount = t.Categories.Count
                })
                .FirstOrDefaultAsync();

            if (track == null)
                return ServiceResult.NotFound("Track not found.");

            return ServiceResult.Ok(track);
        }

        public async Task<ServiceResult> CreateTrackAsync(CreateTrackRequest request)
        {
            var name = request.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
                return ServiceResult.BadRequest("Track name is required.");

            var duplicate = await _context.Tracks.AnyAsync(t => t.Name.ToLower() == name.ToLower());
            if (duplicate)
                return ServiceResult.BadRequest("A track with this name already exists.");

            var track = new Track
            {
                Name = name,
                Description = request.Description,
                IsActive = request.IsActive
            };

            _context.Tracks.Add(track);
            await _context.SaveChangesAsync();

            return ServiceResult.Created(
                "GetTrackById",
                new { trackId = track.TrackId },
                new { message = "Track created successfully.", track.TrackId });
        }

        public async Task<ServiceResult> UpdateTrackAsync(Guid trackId, UpdateTrackRequest request)
        {
            var track = await _context.Tracks.FirstOrDefaultAsync(t => t.TrackId == trackId);
            if (track == null)
                return ServiceResult.NotFound("Track not found.");

            var name = request.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
                return ServiceResult.BadRequest("Track name is required.");

            var duplicate = await _context.Tracks.AnyAsync(t =>
                t.TrackId != trackId && t.Name.ToLower() == name.ToLower());
            if (duplicate)
                return ServiceResult.BadRequest("A track with this name already exists.");

            track.Name = name;
            track.Description = request.Description;
            track.IsActive = request.IsActive;
            track.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Track updated successfully.");
        }

        public async Task<ServiceResult> DeleteTrackAsync(Guid trackId)
        {
            var track = await _context.Tracks.FirstOrDefaultAsync(t => t.TrackId == trackId);
            if (track == null)
                return ServiceResult.NotFound("Track not found.");

            var inUse = await _context.Categories.AnyAsync(c => c.TrackId == trackId);

            if (inUse)
            {
                // Preserve history: keep the row but retire it from pickers/filters.
                if (!track.IsActive)
                    return ServiceResult.OkMessage("Track is already inactive.");

                track.IsActive = false;
                track.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return ServiceResult.OkMessage("Track is in use, so it was deactivated instead of deleted.");
            }

            _context.Tracks.Remove(track);
            await _context.SaveChangesAsync();
            return ServiceResult.OkMessage("Track deleted successfully.");
        }
    }
}
