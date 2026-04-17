namespace Core.Entities;

public class Governorate
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string NameAr { get; set; } = string.Empty;

    public decimal ShippingCost { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
