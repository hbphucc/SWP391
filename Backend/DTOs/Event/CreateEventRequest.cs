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
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public EventStatus Status { get; set; } = EventStatus.Upcoming;
    }
}