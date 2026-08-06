using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Criteria;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class CriteriaService : ICriteriaService
    {
        private readonly ApplicationDbContext _context;

        public CriteriaService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetCriteriaAsync(Guid roundId)
        {
            var roundExists = await _context.Rounds.AnyAsync(r => r.RoundId == roundId);
            if (!roundExists)
                return ServiceResult.NotFound("Round not found.");

            var criteria = await _context.Criteria
                .Where(c => c.RoundId == roundId)
                .Select(c => new
                {
                    c.CriteriaId,
                    c.CriteriaName,
                    c.MaxScore,
                    c.Weight,
                    c.CriterionType,
                    c.RoundId
                })
                .ToListAsync();

            return ServiceResult.Ok(criteria);
        }

        public async Task<ServiceResult> CreateCriteriaAsync(Guid roundId, CreateCriteriaRequest request)
        {
            var round = await _context.Rounds
                .Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.RoundId == roundId);

            if (round == null)
                return ServiceResult.NotFound("Round not found.");

            if (IsEventLocked(round.Event))
                return ServiceResult.BadRequest("Cannot modify criteria after the event has started or finished.");

            var currentTotalWeight = await _context.Criteria
                .Where(c => c.RoundId == roundId)
                .SumAsync(c => c.Weight);

            if (currentTotalWeight + request.Weight > 100)
                return ServiceResult.BadRequest("Total criteria weight cannot exceed 100.");

            var duplicate = await _context.Criteria.AnyAsync(c =>
                c.RoundId == roundId &&
                c.CriteriaName.ToLower() == request.CriteriaName.ToLower());

            if (duplicate)
                return ServiceResult.BadRequest("Criteria name already exists in this round.");

            var criteria = new Criteria
            {
                RoundId = roundId,
                CriteriaName = request.CriteriaName,
                MaxScore = request.MaxScore,
                Weight = request.Weight,
                CriterionType = request.CriterionType
            };

            _context.Criteria.Add(criteria);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = "Criteria created successfully.",
                criteria.CriteriaId
            });
        }

        public async Task<ServiceResult> UpdateCriteriaAsync(Guid roundId, Guid criteriaId, UpdateCriteriaRequest request)
        {
            var criteria = await _context.Criteria
                .Include(c => c.Round)
                    .ThenInclude(r => r.Event)
                .FirstOrDefaultAsync(c => c.RoundId == roundId && c.CriteriaId == criteriaId);

            if (criteria == null)
                return ServiceResult.NotFound("Criteria not found.");

            if (IsEventLocked(criteria.Round?.Event))
                return ServiceResult.BadRequest("Cannot modify criteria after the event has started or finished.");

            var otherWeights = await _context.Criteria
                .Where(c => c.RoundId == roundId && c.CriteriaId != criteriaId)
                .SumAsync(c => c.Weight);

            if (otherWeights + request.Weight > 100)
                return ServiceResult.BadRequest("Total criteria weight cannot exceed 100.");

            criteria.CriteriaName = request.CriteriaName;
            criteria.MaxScore = request.MaxScore;
            criteria.Weight = request.Weight;
            criteria.CriterionType = request.CriterionType;

            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Criteria updated successfully.");
        }

        public async Task<ServiceResult> DeleteCriteriaAsync(Guid roundId, Guid criteriaId)
        {
            var criteria = await _context.Criteria
                .Include(c => c.Scores)
                .Include(c => c.Round)
                    .ThenInclude(r => r.Event)
                .FirstOrDefaultAsync(c => c.RoundId == roundId && c.CriteriaId == criteriaId);

            if (criteria == null)
                return ServiceResult.NotFound("Criteria not found.");

            if (IsEventLocked(criteria.Round?.Event))
                return ServiceResult.BadRequest("Cannot modify criteria after the event has started or finished.");

            if (criteria.Scores.Any())
                return ServiceResult.BadRequest("Cannot delete criteria because it already has scores.");

            _context.Criteria.Remove(criteria);
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Criteria deleted successfully.");
        }

        private static bool IsEventLocked(Event? eventItem)
        {
            if (eventItem == null) return false;
            return eventItem.Status == EventStatus.Ongoing ||
                   eventItem.Status == EventStatus.Completed ||
                   eventItem.Status == EventStatus.Cancelled ||
                   eventItem.StartDate <= DateTime.UtcNow;
        }

        // ─── Reusable templates ────────────────────────────────────────────

        public async Task<ServiceResult> GetTemplatesAsync()
        {
            var templates = await _context.CriteriaTemplates
                .AsNoTracking()
                .OrderBy(t => t.DisplayOrder)
                .ThenBy(t => t.CriteriaName)
                .Select(t => new CriteriaTemplateDto
                {
                    CriteriaTemplateId = t.CriteriaTemplateId,
                    CriteriaName = t.CriteriaName,
                    Description = t.Description,
                    Weight = t.Weight,
                    MaxScore = t.MaxScore,
                    CriterionType = t.CriterionType,
                    DisplayOrder = t.DisplayOrder
                })
                .ToListAsync();

            return ServiceResult.Ok(templates);
        }

        public async Task<ServiceResult> CreateTemplateAsync(SaveCriteriaTemplateRequest request)
        {
            var name = request.CriteriaName.Trim();
            if (string.IsNullOrEmpty(name))
                return ServiceResult.BadRequest("Criterion name is required.");

            if (await _context.CriteriaTemplates.AnyAsync(t => t.CriteriaName.ToLower() == name.ToLower()))
                return ServiceResult.BadRequest("A template with this name already exists.");

            var template = new CriteriaTemplate
            {
                CriteriaName = name,
                Description = request.Description,
                Weight = request.Weight,
                MaxScore = request.MaxScore,
                CriterionType = request.CriterionType,
                DisplayOrder = request.DisplayOrder
            };

            _context.CriteriaTemplates.Add(template);
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new { message = "Template created successfully.", template.CriteriaTemplateId });
        }

        public async Task<ServiceResult> UpdateTemplateAsync(Guid templateId, SaveCriteriaTemplateRequest request)
        {
            var template = await _context.CriteriaTemplates.FindAsync(templateId);
            if (template == null)
                return ServiceResult.NotFound("Template not found.");

            var name = request.CriteriaName.Trim();
            if (string.IsNullOrEmpty(name))
                return ServiceResult.BadRequest("Criterion name is required.");

            if (await _context.CriteriaTemplates.AnyAsync(t =>
                    t.CriteriaTemplateId != templateId && t.CriteriaName.ToLower() == name.ToLower()))
                return ServiceResult.BadRequest("A template with this name already exists.");

            template.CriteriaName = name;
            template.Description = request.Description;
            template.Weight = request.Weight;
            template.MaxScore = request.MaxScore;
            template.CriterionType = request.CriterionType;
            template.DisplayOrder = request.DisplayOrder;

            await _context.SaveChangesAsync();

            // Deliberately does not touch rounds already using a copy of this
            // template: judges must not find the rubric changed under them, and past
            // results must stay reproducible.
            return ServiceResult.OkMessage("Template updated. Rounds already using it are unchanged.");
        }

        public async Task<ServiceResult> DeleteTemplateAsync(Guid templateId)
        {
            var template = await _context.CriteriaTemplates.FindAsync(templateId);
            if (template == null)
                return ServiceResult.NotFound("Template not found.");

            _context.CriteriaTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Template deleted successfully.");
        }

        /// <summary>
        /// Copies templates onto a round. Values are copied, not linked — see
        /// UpdateTemplateAsync for why.
        /// </summary>
        public async Task<ServiceResult> ApplyTemplatesAsync(Guid roundId, ApplyCriteriaTemplateRequest request)
        {
            var roundExists = await _context.Rounds.AnyAsync(r => r.RoundId == roundId);
            if (!roundExists)
                return ServiceResult.NotFound("Round not found.");

            if (request.TemplateIds.Count == 0)
                return ServiceResult.BadRequest("Select at least one template to apply.");

            var templates = await _context.CriteriaTemplates
                .Where(t => request.TemplateIds.Contains(t.CriteriaTemplateId))
                .ToListAsync();

            var missing = request.TemplateIds.FirstOrDefault(id => templates.All(t => t.CriteriaTemplateId != id));
            if (missing != Guid.Empty)
                return ServiceResult.BadRequest($"Template {missing} no longer exists.");

            var existing = await _context.Criteria.Where(c => c.RoundId == roundId).ToListAsync();

            if (request.Replace)
            {
                // Scores reference criteria; dropping them would orphan the marks
                // judges have already given.
                var criteriaIds = existing.Select(c => c.CriteriaId).ToList();
                var hasScores = await _context.Scores.AnyAsync(s => criteriaIds.Contains(s.CriteriaId));

                if (hasScores)
                    return ServiceResult.BadRequest(
                        "This round already has scores, so its criteria cannot be replaced. Add to them instead.");

                _context.Criteria.RemoveRange(existing);
                existing.Clear();
            }

            var added = 0;
            foreach (var template in request.TemplateIds
                         .Select(id => templates.First(t => t.CriteriaTemplateId == id)))
            {
                // Applying the same template twice should be a no-op, not a duplicate.
                if (existing.Any(c => string.Equals(c.CriteriaName, template.CriteriaName, StringComparison.OrdinalIgnoreCase)))
                    continue;

                _context.Criteria.Add(new Criteria
                {
                    RoundId = roundId,
                    CriteriaName = template.CriteriaName,
                    Description = template.Description,
                    Weight = template.Weight,
                    MaxScore = template.MaxScore,
                    CriterionType = template.CriterionType
                });
                added++;
            }

            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
            {
                message = added == 0
                    ? "Those criteria are already on this round."
                    : $"Added {added} criteria from templates.",
                added
            });
        }
    }
}
