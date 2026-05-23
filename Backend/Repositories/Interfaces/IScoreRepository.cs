using SEAL.NET.Models.Entities;

namespace SEAL.NET.Repositories.Interfaces
{
    public interface IScoreRepository : IGenericRepository<Score>
    {
        Task<Score?> GetExistingScoreAsync(Guid submissionId, Guid judgeId, Guid criteriaId);
    }
}