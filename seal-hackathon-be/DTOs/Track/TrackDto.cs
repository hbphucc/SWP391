namespace SEAL.NET.DTOs.Track
{
    public class TrackDto
    {
        public Guid TrackId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        /// <summary>How many event categories have been created from this track.</summary>
        public int UsageCount { get; set; }
    }
}
