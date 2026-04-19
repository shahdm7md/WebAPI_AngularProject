namespace Infrastructure.Settings;

public sealed class PayPalOptions
{
    public const string SectionName = "PayPal";

    public string ClientId { get; set; } = string.Empty;

    public string Secret { get; set; } = string.Empty;
}