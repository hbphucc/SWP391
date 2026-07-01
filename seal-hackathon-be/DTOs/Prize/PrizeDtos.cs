using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Prize
{
    public class PrizeDto
    {
        public Guid PrizeId { get; set; }
        public Guid EventId { get; set; }
        public string EventName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Amount { get; set; }
        public string? Track { get; set; }
        public string? Description { get; set; }
        public int Rank { get; set; }
    }

    public class CreatePrizeRequest
    {
        [Required]
        public Guid EventId { get; set; }

        [Required, MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Amount { get; set; }

        [MaxLength(150)]
        public string? Track { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public int Rank { get; set; }
    }

    public class UpdatePrizeRequest
    {
        [Required, MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Amount { get; set; }

        [MaxLength(150)]
        public string? Track { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public int Rank { get; set; }
    }

    /// <summary>
    /// Prize created together with an event via POST /api/events. Always applies
    /// event-wide (Prize.Track stays null) — there is no per-track prize scoping
    /// from this flow, unlike the standalone /api/prizes endpoint.
    /// </summary>
    public class EventPrizeItemRequest
    {
        [Required, MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Amount { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public int Rank { get; set; }
    }
}
