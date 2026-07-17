namespace SEAL.NET.DTOs.Document
{
    public class DocumentDto
    {
        public Guid DocumentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long Size { get; set; }
        public string? UploaderName { get; set; }
        public Guid? EventId { get; set; }
        public string? EventName { get; set; }
        public string? RoundName { get; set; }
        public bool IsPromptDocument { get; set; }
        public Guid? TeamId { get; set; }
        public string? TeamName { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
