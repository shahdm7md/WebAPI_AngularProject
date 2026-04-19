using System.Globalization;
using Core.DTOs.Payment;
using Core.Interfaces;
using Microsoft.Extensions.Options;
using PayPalCheckoutSdk.Core;
using PayPalCheckoutSdk.Orders;
using Infrastructure.Settings;

namespace Infrastructure.Services;

public sealed class PayPalService : IPayPalService
{
    private readonly PayPalHttpClient _client;

    public PayPalService(IOptions<PayPalOptions> options)
    {
        var paypalOptions = options.Value;

        if (string.IsNullOrWhiteSpace(paypalOptions.ClientId))
        {
            throw new InvalidOperationException("PayPal client id is not configured.");
        }

        if (string.IsNullOrWhiteSpace(paypalOptions.Secret))
        {
            throw new InvalidOperationException("PayPal secret is not configured.");
        }

        _client = new PayPalHttpClient(new SandboxEnvironment(paypalOptions.ClientId, paypalOptions.Secret));
    }

    public async Task<string> CreateOrderAsync(decimal amount, string currency = "USD")
    {
        var request = new OrdersCreateRequest();
        request.Prefer("return=representation");
        request.RequestBody(new OrderRequest
        {
            CheckoutPaymentIntent = "CAPTURE",
            PurchaseUnits =
            [
                new PurchaseUnitRequest
                {
                    AmountWithBreakdown = new AmountWithBreakdown
                    {
                        CurrencyCode = currency,
                        Value = Math.Max(0, amount).ToString("0.00", CultureInfo.InvariantCulture)
                    }
                }
            ]
        });

        var response = await _client.Execute(request);
        var result = response.Result<Order>();

        return result.Id;
    }

    public async Task<PayPalCaptureResultDto> CaptureOrderAsync(string paypalOrderId)
    {
        var request = new OrdersCaptureRequest(paypalOrderId);
        request.Prefer("return=representation");
        request.RequestBody(new OrderActionRequest());

        var response = await _client.Execute(request);
        var result = response.Result<Order>();

        var capture = result.PurchaseUnits?
            .FirstOrDefault()?
            .Payments?
            .Captures?
            .FirstOrDefault();

        var completed = string.Equals(result.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase)
            || string.Equals(capture?.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase);

        return new PayPalCaptureResultDto
        {
            Success = completed,
            TransactionId = capture?.Id,
            Status = capture?.Status ?? result.Status,
            Message = completed ? "Payment captured successfully." : "PayPal capture did not complete."
        };
    }

    public async Task<PayPalCaptureResultDto> GetOrderStatusAsync(string paypalOrderId)
    {
        var request = new OrdersGetRequest(paypalOrderId);
        var response = await _client.Execute(request);
        var result = response.Result<Order>();

        var capture = result.PurchaseUnits?
            .FirstOrDefault()?
            .Payments?
            .Captures?
            .FirstOrDefault();

        var completed = string.Equals(result.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase)
            || string.Equals(capture?.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase);

        return new PayPalCaptureResultDto
        {
            Success = completed,
            TransactionId = capture?.Id,
            Status = capture?.Status ?? result.Status,
            Message = completed ? "PayPal order already completed." : "PayPal order is not completed yet."
        };
    }
}