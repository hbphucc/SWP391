namespace SEAL.NET.DTOs.Category
{
    public class CategoryDto
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TeamCount { get; set; }
    }
}
