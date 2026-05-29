namespace SEAL.NET.DTOs.Round
{
    public class RoundDto
    {
        public Guid RoundId { get; set; }
        public string RoundName { get; set; } = string.Empty;
        public int RoundOrder { get; set; }
        public int MaxTeamsAdvancing { get; set; }
        public DateTime? SubmissionDeadline { get; set; }
    }
}
