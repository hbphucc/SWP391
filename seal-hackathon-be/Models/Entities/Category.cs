using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class Category
    {
        public Guid CategoryId { get; set; } = Guid.NewGuid();

        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Guid EventId { get; set; }
        public Event Event { get; set; } = null!;

        // Optional back-link to the global catalog Track this category was created
        // from. Nullable so ad-hoc categories (and all pre-existing ones) remain valid.
        public Guid? TrackId { get; set; }
        public Track? Track { get; set; }

        public List<Team> Teams { get; set; } = [];
        public List<JudgeAssignment> JudgeAssignments { get; set; } = [];
    }
}
