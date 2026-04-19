using Core.DTOs.Payment;

namespace Core.Interfaces;

public interface IPayPalService
{
    Task<string> CreateOrderAsync(decimal amount, string currency = "USD");

    Task<PayPalCaptureResultDto> CaptureOrderAsync(string paypalOrderId);

    Task<PayPalCaptureResultDto> GetOrderStatusAsync(string paypalOrderId);
}