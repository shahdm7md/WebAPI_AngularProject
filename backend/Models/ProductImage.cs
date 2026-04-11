namespace backend.Models;

public class ProductImage
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public bool IsMain { get; set; }

    public Product? Product { get; set; }
}