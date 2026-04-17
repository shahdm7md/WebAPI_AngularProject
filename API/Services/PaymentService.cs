using API.Settings;
using Core.DTOs.Payment;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SharedKernel.Enums;
using Stripe;
using Stripe.Checkout;
using PaymentMethodEnum = SharedKernel.Enums.PaymentMethod;

namespace API.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;
    private readonly StripeOptions _stripeOptions;

    public PaymentService(AppDbContext context, IOptions<StripeOptions> stripeOptions)
    {
        _context = context;
        _stripeOptions = stripeOptions.Value;

        if (string.IsNullOrWhiteSpace(_stripeOptions.SecretKey))
        {
            throw new InvalidOperationException("Stripe secret key is not configured.");
        }

        StripeConfiguration.ApiKey = _stripeOptions.SecretKey;
    }

    public async Task<StripeSessionResponseDto> CreateStripeSessionAsync(string userId, int orderId)
    {
        var payment = await GetPaymentForUserAsync(userId, orderId);

        if (payment.PaymentMethod != PaymentMethodEnum.Card)
        {
            throw new InvalidOperationException("Stripe checkout is available only for Stripe payment method.");
        }

        var baseUrl = (_stripeOptions.FrontendBaseUrl ?? string.Empty).TrimEnd('/');
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException("Stripe frontend URL is not configured.");
        }

        var options = new SessionCreateOptions
        {
            Mode = "payment",
            SuccessUrl = $"{baseUrl}/success?orderId={orderId}&session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{baseUrl}/cancel?orderId={orderId}",
            Metadata = new Dictionary<string, string>
            {
                ["orderId"] = orderId.ToString(),
                ["userId"] = userId
            },
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "egp",
                        UnitAmount = ConvertToStripeAmount(payment.Order!.TotalAmount),
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Order #{orderId}"
                        }
                    }
                }
            ]
        };

        var sessionService = new SessionService();
        var session = await sessionService.CreateAsync(options);

        payment.TransactionId = session.Id;
        payment.Status = PaymentStatus.Pending;
        await _context.SaveChangesAsync();

        return new StripeSessionResponseDto
        {
            SessionId = session.Id,
            CheckoutUrl = session.Url ?? string.Empty
        };
    }

    public async Task ConfirmPaymentAsync(string userId, int orderId, string? sessionId = null)
    {
        var payment = await GetPaymentForUserAsync(userId, orderId);

        if (payment.PaymentMethod == PaymentMethodEnum.Cash)
        {
            if (payment.Status != PaymentStatus.Completed)
            {
                throw new InvalidOperationException("Cash payment is not completed yet.");
            }

            payment.Order!.Status = OrderStatus.Paid;
            await _context.SaveChangesAsync();
            return;
        }

        var stripeSessionId = sessionId;
        if (string.IsNullOrWhiteSpace(stripeSessionId))
        {
            stripeSessionId = payment.TransactionId;
        }

        if (string.IsNullOrWhiteSpace(stripeSessionId))
        {
            throw new InvalidOperationException("Missing Stripe session id.");
        }

        var sessionService = new SessionService();
        var session = await sessionService.GetAsync(stripeSessionId);

        if (!string.Equals(session.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Stripe payment is not completed.");
        }

        payment.Status = PaymentStatus.Completed;
        payment.PaidAt = DateTime.UtcNow;
        payment.TransactionId = session.PaymentIntentId ?? payment.TransactionId;
        payment.Order!.Status = OrderStatus.Paid;

        await _context.SaveChangesAsync();
    }

    public async Task CashPaymentAsync(string userId, int orderId)
    {
        var payment = await GetPaymentForUserAsync(userId, orderId);

        if (payment.PaymentMethod != PaymentMethodEnum.Cash)
        {
            throw new InvalidOperationException("Order payment method is not cash on delivery.");
        }

        payment.Status = PaymentStatus.Completed;
        payment.PaidAt = DateTime.UtcNow;
        payment.TransactionId ??= $"CASH-{Guid.NewGuid():N}";
        payment.Order!.Status = OrderStatus.Paid;

        await _context.SaveChangesAsync();
    }

    private async Task<Payment> GetPaymentForUserAsync(string userId, int orderId)
    {
        var payment = await _context.Payments
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.OrderId == orderId && p.Order!.UserId == userId)
            ?? throw new KeyNotFoundException("Order payment was not found.");

        return payment;
    }

    private static long ConvertToStripeAmount(decimal amount)
    {
        var safeAmount = Math.Max(0, amount);
        return (long)Math.Round(safeAmount * 100m, MidpointRounding.AwayFromZero);
    }
}
