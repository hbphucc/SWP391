using SEAL.NET.DTOs.Event;

namespace SEAL.NET.Services.Interfaces
{
    public interface IEventService
    {
        Task<List<EventResponseDto>> GetAllEventsAsync();
        Task<EventResponseDto?> GetEventByIdAsync(Guid id);
        Task<(bool Success, string Message, Guid? Id)> CreateEventAsync(CreateEventRequest request);
        Task<(bool Success, string Message)> UpdateEventAsync(Guid id, UpdateEventRequest request);
        Task<(bool Success, string Message)> DeleteEventAsync(Guid id);
        Task<(bool Success, string Message)> PublishEventAsync(Guid id, Guid actorId);
        Task<(bool Success, string Message)> StartEventAsync(Guid id, Guid actorId);
        Task<(bool Success, string Message)> CompleteEventAsync(Guid id, Guid actorId);
        Task<(bool Success, string Message)> CancelEventAsync(Guid id, Guid actorId, string? reason);
        Task<(bool Success, string Message)> RegisterForEventAsync(Guid eventId, Guid userId, string role);
        Task<List<Guid>> GetMyRegisteredEventIdsAsync(Guid userId);
    }
}
