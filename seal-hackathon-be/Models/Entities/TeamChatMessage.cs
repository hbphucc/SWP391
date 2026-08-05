using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEAL.NET.Models.Entities
{
    public class TeamChatMessage
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid TeamId { get; set; }
        [ForeignKey(nameof(TeamId))]
        public Team Team { get; set; } = null!;

        public Guid SenderId { get; set; }
        [ForeignKey(nameof(SenderId))]
        public ApplicationUser Sender { get; set; } = null!;

        [Required]
        [MaxLength(150)]
        public string SenderName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string SenderRole { get; set; } = string.Empty;

        [MaxLength(4000)]
        public string Message { get; set; } = string.Empty;

        public Guid? DocumentId { get; set; }
        [ForeignKey(nameof(DocumentId))]
        public Document? AttachedDocument { get; set; }

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
