using SendGrid;
using SendGrid.Helpers.Mail;
using System.CodeDom;
using Microsoft.Extensions.Configuration; 
namespace API.Services
{
    public class EmailServicecs 
    {
        private readonly IConfiguration _config;

        public EmailServicecs(IConfiguration config)
        {
            _config = config;
        }
        public async Task SendEmailAsync(string toEmail, string subject, string content)
        {
            try
            {
                var apiKey = _config["SendGrid:ApiKey"];
                var client = new SendGridClient(apiKey);
                var from = new EmailAddress(_config["SendGrid:FromEmail"], "E-Commerce Shop");
                var to = new EmailAddress(toEmail);
                var msg = MailHelper.CreateSingleEmail(from, to, subject, content, content);

                var response = await client.SendEmailAsync(msg);

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
