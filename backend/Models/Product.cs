namespace backend.Models;

public class Product
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public string SellerId { get; set; } = string.Empty;

    public int CategoryId { get; set; }

    public ApplicationUser? Seller { get; set; }

    public Category? Category { get; set; }

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();

    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    public ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();
}