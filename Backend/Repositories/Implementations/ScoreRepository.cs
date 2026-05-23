using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Models.Entities;
using SEAL.NET.Repositories.Interfaces;

namespace SEAL.NET.Repositories.Implementations
{
    public class ScoreRepository : GenericRepository<Score>, IScoreRepository
    {
        public ScoreRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Score?> GetExistingScoreAsync(Guid submissionId, Guid judgeId, Guid criteriaId)
        {
            return await _context.Scores.FirstOrDefaultAsync(s =>
                s.SubmissionId == submissionId &&
                s.JudgeId == judgeId &&
                s.CriteriaId == criteriaId);
        }
    }
}
