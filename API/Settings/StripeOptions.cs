namespace API.Settings;

public class StripeOptions
{
    public const string SectionName = "Stripe";

    public string SecretKey { get; set; } = string.Empty;

    public string PublishableKey { get; set; } = string.Empty;

    public string FrontendBaseUrl { get; set; } = "http://localhost:4200";
}
