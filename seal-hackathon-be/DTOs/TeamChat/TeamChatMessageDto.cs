namespace SEAL.NET.DTOs.TeamChat
{
    public record TeamChatMessageDto(
        Guid Id,
        Guid TeamId,
        Guid SenderId,
        string SenderName,
        string SenderRole,
        string Message,
        Guid? DocumentId,
        string? DocumentName,
        long? DocumentSize,
        DateTime SentAt
    );
}
