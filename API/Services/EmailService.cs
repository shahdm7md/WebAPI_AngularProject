using Core.Interfaces;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string content)
        {
            var apiKey = _config["SendGrid:ApiKey"];
            var fromEmail = _config["SendGrid:FromEmail"];

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException("SendGrid ApiKey is missing.");
            }

            if (string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("SendGrid FromEmail is missing.");
            }

            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(fromEmail, "E-CommerceShop");
            var to = new EmailAddress(toEmail);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, content, content);

            var response = await client.SendEmailAsync(msg);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Order email sent successfully to {ToEmail}", toEmail);
                return;
            }

            var body = await response.Body.ReadAsStringAsync();
            _logger.LogError("SendGrid failed. Status: {StatusCode}. To: {ToEmail}. Body: {Body}",
                response.StatusCode, toEmail, body);
            throw new InvalidOperationException($"SendGrid failed with status {response.StatusCode}.");
        }
    }
}
