namespace API.Settings;

public class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string SmtpHost { get; set; } = string.Empty;

    public int SmtpPort { get; set; } = 587;

    public string SmtpUser { get; set; } = string.Empty;

    public string SmtpPassword { get; set; } = string.Empty;

    public string SenderName { get; set; } = string.Empty;

    public string SenderEmail { get; set; } = string.Empty;

    public string? PickupDirectory { get; set; }

    public bool UsePickupDirectory { get; set; }
}
