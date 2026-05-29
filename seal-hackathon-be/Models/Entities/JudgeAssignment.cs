
namespace SEAL.NET.Models.Entities
{
    public class JudgeAssignment
    {
        public Guid AssignmentId { get; set; } = Guid.NewGuid();

        public Guid? RoundId { get; set; }
        public Round? Round { get; set; }

        public Guid? CategoryId { get; set; }
        public Category? Category { get; set; }

        public Guid JudgeId { get; set; }
        public ApplicationUser Judge { get; set; } = null!;
    }
}
