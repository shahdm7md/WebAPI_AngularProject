namespace Core.Entities;

public class Review
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public int ProductId { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }

    public Product? Product { get; set; }
}