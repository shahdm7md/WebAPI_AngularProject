using Core.DTOs.Payment;

namespace Core.Interfaces;

public interface IPaymentService
{
    Task<StripeSessionResponseDto> CreateStripeSessionAsync(string userId, int orderId);

    Task ConfirmPaymentAsync(string userId, int orderId, string? sessionId = null);

    Task CashPaymentAsync(string userId, int orderId);
}
