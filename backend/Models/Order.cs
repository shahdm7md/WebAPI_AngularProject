using backend.Models.Enums;

namespace backend.Models;

public class Order
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public decimal TotalAmount { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    public Payment? Payment { get; set; }
}