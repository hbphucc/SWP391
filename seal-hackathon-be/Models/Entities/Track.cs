using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    /// <summary>
    /// A reusable, global competition-track template (e.g. "AI &amp; Machine Learning").
    /// Tracks form the catalog admins pick from when creating an event; selecting a
    /// track materializes a per-event <see cref="Category"/> (which Teams register into
    /// and Judges are assigned to). The <see cref="Category.TrackId"/> back-link records
    /// which catalog track a category originated from.
    /// </summary>
    public class Track
    {
        public Guid TrackId { get; set; } = Guid.NewGuid();

        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public List<Category> Categories { get; set; } = [];
    }
}
