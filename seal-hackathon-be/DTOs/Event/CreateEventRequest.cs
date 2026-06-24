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



        /// <summary>
        /// Optional catalog tracks to attach. Each materializes a per-event Category
        /// (Teams register into Categories). Duplicates and inactive tracks are ignored.
        /// </summary>
        public List<Guid> TrackIds { get; set; } = [];
    }
}
