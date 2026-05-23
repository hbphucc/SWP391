using SEAL.NET.Models.Entities;

namespace SEAL.NET.Repositories.Interfaces
{
    public interface ITeamRepository : IGenericRepository<Team>
    {
        Task<Team?> GetTeamWithMembersAsync(Guid teamId);
        Task<Team?> GetTeamDetailAsync(Guid teamId);
    }
}