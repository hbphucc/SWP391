using SEAL.NET.DTOs.Criteria;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface ICriteriaService
    {
        Task<ServiceResult> GetCriteriaAsync(Guid roundId);
        Task<ServiceResult> CreateCriteriaAsync(Guid roundId, CreateCriteriaRequest request);
        Task<ServiceResult> UpdateCriteriaAsync(Guid roundId, Guid criteriaId, UpdateCriteriaRequest request);
        Task<ServiceResult> DeleteCriteriaAsync(Guid roundId, Guid criteriaId);

        // Reusable rubric kept outside any event, so organisers stop retyping the
        // same criteria for every hackathon.
        Task<ServiceResult> GetTemplatesAsync();
        Task<ServiceResult> CreateTemplateAsync(SaveCriteriaTemplateRequest request);
        Task<ServiceResult> UpdateTemplateAsync(Guid templateId, SaveCriteriaTemplateRequest request);
        Task<ServiceResult> DeleteTemplateAsync(Guid templateId);
        Task<ServiceResult> ApplyTemplatesAsync(Guid roundId, ApplyCriteriaTemplateRequest request);
    }
}
