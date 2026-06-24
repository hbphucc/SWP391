using SEAL.NET.DTOs.Track;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>Global competition-track catalog (for <c>TracksController</c>).</summary>
    public interface ITrackService
    {
        /// <summary>Lists tracks. <paramref name="activeOnly"/> filters to IsActive; <paramref name="search"/> matches name/description.</summary>
        Task<ServiceResult> GetTracksAsync(bool activeOnly, string? search);
        Task<ServiceResult> GetTrackByIdAsync(Guid trackId);
        Task<ServiceResult> CreateTrackAsync(CreateTrackRequest request);
        Task<ServiceResult> UpdateTrackAsync(Guid trackId, UpdateTrackRequest request);

        /// <summary>Soft-deletes (IsActive=false) when the track is in use; hard-deletes otherwise.</summary>
        Task<ServiceResult> DeleteTrackAsync(Guid trackId);
    }
}
