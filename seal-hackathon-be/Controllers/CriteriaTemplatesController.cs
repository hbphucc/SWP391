using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Criteria;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    /// <summary>
    /// The reusable rubric, kept outside any event so a new hackathon can start
    /// from the standard criteria instead of retyping them.
    /// </summary>
    [Route("api/criteria-templates")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class CriteriaTemplatesController : ControllerBase
    {
        private readonly ICriteriaService _criteriaService;

        public CriteriaTemplatesController(ICriteriaService criteriaService)
        {
            _criteriaService = criteriaService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTemplates()
            => this.ToActionResult(await _criteriaService.GetTemplatesAsync());

        [HttpPost]
        public async Task<IActionResult> CreateTemplate([FromBody] SaveCriteriaTemplateRequest request)
            => this.ToActionResult(await _criteriaService.CreateTemplateAsync(request));

        [HttpPut("{templateId:guid}")]
        public async Task<IActionResult> UpdateTemplate(Guid templateId, [FromBody] SaveCriteriaTemplateRequest request)
            => this.ToActionResult(await _criteriaService.UpdateTemplateAsync(templateId, request));

        [HttpDelete("{templateId:guid}")]
        public async Task<IActionResult> DeleteTemplate(Guid templateId)
            => this.ToActionResult(await _criteriaService.DeleteTemplateAsync(templateId));

        /// <summary>Copies the chosen templates onto a round's criteria list.</summary>
        [HttpPost("apply/{roundId:guid}")]
        public async Task<IActionResult> ApplyToRound(Guid roundId, [FromBody] ApplyCriteriaTemplateRequest request)
            => this.ToActionResult(await _criteriaService.ApplyTemplatesAsync(roundId, request));
    }
}
