using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Category;
using SEAL.NET.Models.Entities;

namespace SEAL.NET.Controllers
{
    [Route("api/events/{eventId}/categories")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class CategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories(Guid eventId)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.EventId == eventId);
            if (!eventExists)
                return NotFound(new { message = "Event not found." });

            var categories = await _context.Categories
                .Where(c => c.EventId == eventId)
                .Select(c => new
                {
                    c.CategoryId,
                    c.CategoryName,
                    c.Description,
                    c.EventId
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{categoryId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoryById(Guid eventId, Guid categoryId)
        {
            var category = await _context.Categories
                .Where(c => c.EventId == eventId && c.CategoryId == categoryId)
                .Select(c => new
                {
                    c.CategoryId,
                    c.CategoryName,
                    c.Description,
                    c.EventId
                })
                .FirstOrDefaultAsync();

            if (category == null)
                return NotFound(new { message = "Category not found." });

            return Ok(category);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory(Guid eventId, [FromBody] CreateCategoryRequest request)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.EventId == eventId);
            if (!eventExists)
                return NotFound(new { message = "Event not found." });

            var duplicate = await _context.Categories.AnyAsync(c =>
                c.EventId == eventId &&
                c.CategoryName.ToLower() == request.CategoryName.ToLower());

            if (duplicate)
                return BadRequest(new { message = "Category name already exists in this event." });

            var category = new Category
            {
                EventId = eventId,
                CategoryName = request.CategoryName,
                Description = request.Description
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategoryById), new
            {
                eventId,
                categoryId = category.CategoryId
            }, new
            {
                message = "Category created successfully.",
                category.CategoryId
            });
        }

        [HttpPut("{categoryId}")]
        public async Task<IActionResult> UpdateCategory(Guid eventId, Guid categoryId, [FromBody] UpdateCategoryRequest request)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.EventId == eventId && c.CategoryId == categoryId);

            if (category == null)
                return NotFound(new { message = "Category not found." });

            var duplicate = await _context.Categories.AnyAsync(c =>
                c.EventId == eventId &&
                c.CategoryId != categoryId &&
                c.CategoryName.ToLower() == request.CategoryName.ToLower());

            if (duplicate)
                return BadRequest(new { message = "Category name already exists in this event." });

            category.CategoryName = request.CategoryName;
            category.Description = request.Description;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Category updated successfully." });
        }

        [HttpDelete("{categoryId}")]
        public async Task<IActionResult> DeleteCategory(Guid eventId, Guid categoryId)
        {
            var category = await _context.Categories
                .Include(c => c.Teams)
                .Include(c => c.JudgeAssignments)
                .FirstOrDefaultAsync(c => c.EventId == eventId && c.CategoryId == categoryId);

            if (category == null)
                return NotFound(new { message = "Category not found." });

            if (category.Teams.Any() || category.JudgeAssignments.Any())
                return BadRequest(new { message = "Cannot delete category because it already has teams or judge assignments." });

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Category deleted successfully." });
        }
    }
}