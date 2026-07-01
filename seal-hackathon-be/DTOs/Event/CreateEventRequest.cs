using SEAL.NET.DTOs.Prize;
using SEAL.NET.DTOs.Round;
using SEAL.NET.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Event
{
    public class CreateEventRequest
    {
        [Required]
        [MaxLength(200)]
        public string EventName { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        public DateTime RegistrationStartDate { get; set; }

        [Required]
        public DateTime RegistrationEndDate { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [MaxLength(2048)]
        public string? PosterUrl { get; set; }

        [MaxLength(2048)]
        public string? WinnerImageUrl { get; set; }
        /// <summary>
        /// Optional catalog tracks to attach. Each materializes a per-event Category
        /// (Teams register into Categories). Duplicates and inactive tracks are ignored.
        /// </summary>
        public List<Guid> TrackIds { get; set; } = [];

        /// <summary>
        /// Optional rounds to create together with the event in a single transaction.
        /// When empty, the event is created without rounds (legacy shape) and rounds
        /// can be added later via POST /api/events/{id}/rounds.
        /// </summary>
        public List<CreateRoundRequest> Rounds { get; set; } = [];

        /// <summary>
        /// Optional prizes to create together with the event, applying event-wide
        /// across all tracks. More can be added later via POST /api/prizes.
        /// </summary>
        public List<EventPrizeItemRequest> Prizes { get; set; } = [];
    }
}
