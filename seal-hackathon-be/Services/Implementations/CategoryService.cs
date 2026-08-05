using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Category;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context;

        public CategoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetCategoriesAsync(Guid eventId)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.EventId == eventId);
            if (!eventExists)
                return ServiceResult.NotFound("Event not found.");

            var categories = await _context.Categories
                .Where(c => c.EventId == eventId)
                .Select(c => new
                {
                    c.CategoryId,
                    c.CategoryName,
                    c.Description,
                    c.EventId,
                    Teams = c.Teams
                        .Where(t => t.Status != TeamStatus.Eliminated &&
                                    t.Status != TeamStatus.Rejected &&
                                    t.Status != TeamStatus.Withdrawn)
                        .Select(t => new { t.TeamId, t.TeamName })
                        .ToList()
                })
                .ToListAsync();

            return ServiceResult.Ok(categories);
        }

        public async Task<ServiceResult> GetCategoryByIdAsync(Guid eventId, Guid categoryId)
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
                return ServiceResult.NotFound("Category not found.");

            return ServiceResult.Ok(category);
        }

        public async Task<ServiceResult> CreateCategoryAsync(Guid eventId, CreateCategoryRequest request)
        {
            var eventItem = await _context.Events.FirstOrDefaultAsync(e => e.EventId == eventId);
            if (eventItem == null)
                return ServiceResult.NotFound("Event not found.");

            if (IsEventLocked(eventItem))
                return ServiceResult.BadRequest("Cannot modify tracks after the event has started or finished.");

            var duplicate = await _context.Categories.AnyAsync(c =>
                c.EventId == eventId &&
                c.CategoryName.ToLower() == request.CategoryName.ToLower());

            if (duplicate)
                return ServiceResult.BadRequest("Category name already exists in this event.");

            var category = new Category
            {
                EventId = eventId,
                CategoryName = request.CategoryName,
                Description = request.Description
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return ServiceResult.Created(
                "GetCategoryById",
                new { eventId, categoryId = category.CategoryId },
                new
                {
                    message = "Category created successfully.",
                    category.CategoryId
                });
        }

        public async Task<ServiceResult> UpdateCategoryAsync(Guid eventId, Guid categoryId, UpdateCategoryRequest request)
        {
            var category = await _context.Categories
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.EventId == eventId && c.CategoryId == categoryId);

            if (category == null)
                return ServiceResult.NotFound("Category not found.");

            if (IsEventLocked(category.Event))
                return ServiceResult.BadRequest("Cannot modify tracks after the event has started or finished.");

            var duplicate = await _context.Categories.AnyAsync(c =>
                c.EventId == eventId &&
                c.CategoryId != categoryId &&
                c.CategoryName.ToLower() == request.CategoryName.ToLower());

            if (duplicate)
                return ServiceResult.BadRequest("Category name already exists in this event.");

            category.CategoryName = request.CategoryName;
            category.Description = request.Description;

            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Category updated successfully.");
        }

        public async Task<ServiceResult> DeleteCategoryAsync(Guid eventId, Guid categoryId)
        {
            var category = await _context.Categories
                .Include(c => c.Teams)
                .Include(c => c.JudgeAssignments)
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.EventId == eventId && c.CategoryId == categoryId);

            if (category == null)
                return ServiceResult.NotFound("Category not found.");

            if (IsEventLocked(category.Event))
                return ServiceResult.BadRequest("Cannot modify tracks after the event has started or finished.");

            if (category.Teams.Any() || category.JudgeAssignments.Any())
                return ServiceResult.BadRequest("Cannot delete category because it already has teams or judge assignments.");

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Category deleted successfully.");
        }

        private static bool IsEventLocked(Event? eventItem)
        {
            if (eventItem == null) return false;
            return eventItem.Status == EventStatus.Ongoing ||
                   eventItem.Status == EventStatus.Completed ||
                   eventItem.Status == EventStatus.Cancelled ||
                   eventItem.StartDate <= DateTime.UtcNow;
        }
    }
}
