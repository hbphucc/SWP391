using SEAL.NET.Models.Entities;

namespace SEAL.NET.Repositories.Interfaces
{
    public interface IEventRepository : IGenericRepository<Event>
    {
        Task<List<Event>> GetEventsWithDetailsAsync();
        Task<Event?> GetEventDetailAsync(Guid eventId);
        Task<bool> HasSubmissionsAsync(Guid eventId);
        Task HardDeleteAsync(Guid eventId);
    }
}
