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
    }
}
