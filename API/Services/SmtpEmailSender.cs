using System.Net;
using System.Net.Mail;
using System.Text;
using API.Settings;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Hosting;

namespace API.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;
    private readonly IWebHostEnvironment _environment;

    public SmtpEmailSender(IOptions<EmailSettings> settings, IWebHostEnvironment environment)
    {
        _settings = settings.Value;
        _environment = environment;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            throw new InvalidOperationException("Recipient email address is required.");
        }

        if (CanUseSmtp())
        {
            await SendViaSmtpAsync(toEmail, subject, htmlBody);
            return;
        }

        await WriteToPickupDirectoryAsync(toEmail, subject, htmlBody);
    }

    private bool CanUseSmtp()
    {
        return !string.IsNullOrWhiteSpace(_settings.SmtpHost) &&
               !string.IsNullOrWhiteSpace(_settings.SmtpUser) &&
               !string.IsNullOrWhiteSpace(_settings.SmtpPassword) &&
               !string.IsNullOrWhiteSpace(_settings.SenderEmail);
    }

    private async Task SendViaSmtpAsync(string toEmail, string subject, string htmlBody)
    {
        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(_settings.SmtpUser, _settings.SmtpPassword)
        };

        using var message = new MailMessage
        {
            From = new MailAddress(_settings.SenderEmail, _settings.SenderName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(toEmail);

        await client.SendMailAsync(message);
    }

    private async Task WriteToPickupDirectoryAsync(string toEmail, string subject, string htmlBody)
    {
        if (!_environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Email settings are not configured. Set SMTP credentials in EmailSettings to deliver real email.");
        }

        var directory = _settings.PickupDirectory;
        if (string.IsNullOrWhiteSpace(directory))
        {
            directory = Path.Combine(AppContext.BaseDirectory, "EmailOutbox");
        }

        Directory.CreateDirectory(directory);

        var fileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}.eml";
        var filePath = Path.Combine(directory, fileName);

        var content = new StringBuilder()
            .AppendLine($"To: {toEmail}")
            .AppendLine($"Subject: {subject}")
            .AppendLine("Content-Type: text/html; charset=utf-8")
            .AppendLine()
            .AppendLine(htmlBody)
            .ToString();

        await File.WriteAllTextAsync(filePath, content);
    }
}
