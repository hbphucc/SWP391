using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Models.Entities;
using SEAL.NET.Repositories.Interfaces;

namespace SEAL.NET.Repositories.Implementations
{
    public class TeamRepository : GenericRepository<Team>, ITeamRepository
    {
        public TeamRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Team?> GetTeamWithMembersAsync(Guid teamId)
        {
            return await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);
        }

        public async Task<Team?> GetTeamDetailAsync(Guid teamId)
        {
            return await _context.Teams
                .Include(t => t.Category)
                .Include(t => t.CurrentRound)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);
        }
    }
}