using SEAL.NET.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Event
{
    public class UpdateEventRequest
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
        /// Optional catalog tracks. Additive only: tracks not already attached to the
        /// event get a new Category. Existing categories are never removed here (they
        /// may have teams) — remove those via the categories endpoint.
        /// </summary>
        public List<Guid> TrackIds { get; set; } = [];
    }
}
