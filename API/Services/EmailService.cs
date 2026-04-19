using Core.Interfaces;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Net.Mail;

namespace API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        public EmailService(IConfiguration config) 
        {
            _config = config;
        }
        public async Task SendEmailAsync(string toEmail, string subject, string content)
        {
            try
            {
                var apiKey = _config["SendGrid:ApiKey"];
                var client = new SendGridClient(apiKey);
                var from = new EmailAddress(_config["SendGrid:FromEmail"], "E-CommerceShop");
                var to = new EmailAddress(toEmail);
                var msg = MailHelper.CreateSingleEmail(from, to, subject, content, content);

                var response = await client.SendEmailAsync(msg);

                // ده أهم جزء للـ Test
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("Email Sent Successfully!");
                }
                else
                {
                    var body = await response.Body.ReadAsStringAsync();
                    Console.WriteLine($"Failed to send email. Status: {response.StatusCode}. Error: {body}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
            }
        }
    }
}
