using Core.DTOs.Payment;
using Core.Interfaces;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SharedKernel.Enums;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public sealed class PayPalController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPayPalService _payPalService;

    public PayPalController(AppDbContext context, IPayPalService payPalService)
    {
        _context = context;
        _payPalService = payPalService;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpPost("create-order")]
    public async Task<ActionResult<PayPalCreateOrderResponseDto>> CreateOrder([FromBody] PayPalCreateOrderRequestDto request)
    {
        if (request.Amount <= 0)
        {
            return BadRequest(new { error = "Amount must be greater than zero." });
        }

        var paypalOrderId = await _payPalService.CreateOrderAsync(request.Amount, "USD");

        return Ok(new PayPalCreateOrderResponseDto { PaypalOrderId = paypalOrderId });
    }

    [HttpPost("capture-order")]
    public async Task<IActionResult> CaptureOrder([FromBody] PayPalCaptureOrderRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.PaypalOrderId))
        {
            return BadRequest(new { error = "PayPal order id is required." });
        }

        if (request.SystemOrderId <= 0)
        {
            try
            {
                var captureOnly = await _payPalService.CaptureOrderAsync(request.PaypalOrderId);

                if (!captureOnly.Success)
                {
                    var statusCheckOnly = await _payPalService.GetOrderStatusAsync(request.PaypalOrderId);
                    if (!statusCheckOnly.Success)
                    {
                        return BadRequest(new { error = captureOnly.Message, paypalStatus = captureOnly.Status });
                    }

                    captureOnly = statusCheckOnly;
                }

                return Ok(new
                {
                    success = true,
                    transactionId = captureOnly.TransactionId ?? request.PaypalOrderId,
                    status = captureOnly.Status,
                    message = captureOnly.Message
                });
            }
            catch (Exception ex)
            {
                try
                {
                    var statusCheckOnly = await _payPalService.GetOrderStatusAsync(request.PaypalOrderId);
                    if (statusCheckOnly.Success)
                    {
                        return Ok(new
                        {
                            success = true,
                            transactionId = statusCheckOnly.TransactionId ?? request.PaypalOrderId,
                            status = statusCheckOnly.Status,
                            message = "PayPal order was already captured."
                        });
                    }
                }
                catch
                {
                }

                return BadRequest(new { error = ex.Message });
            }
        }

        var order = await _context.Orders
            .Include(o => o.Payment)
            .FirstOrDefaultAsync(o => o.Id == request.SystemOrderId && o.UserId == GetUserId())
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.Payment?.PaymentMethod != PaymentMethod.PayPal)
        {
            return BadRequest(new { error = "This order is not configured for PayPal." });
        }

        if (order.Payment.Status == PaymentStatus.Completed)
        {
            return Ok(new
            {
                success = true,
                transactionId = order.Payment.TransactionId,
                status = order.Payment.Status
            });
        }

        try
        {
            var capture = await _payPalService.CaptureOrderAsync(request.PaypalOrderId);

            if (!capture.Success)
            {
                var statusCheck = await _payPalService.GetOrderStatusAsync(request.PaypalOrderId);
                if (!statusCheck.Success)
                {
                    order.Payment.Status = PaymentStatus.Failed;
                    await _context.SaveChangesAsync();
                    return BadRequest(new { error = capture.Message, paypalStatus = capture.Status });
                }

                capture = statusCheck;
            }

            order.Payment.Status = PaymentStatus.Completed;
            order.Payment.PaidAt = DateTime.UtcNow;
            order.Payment.TransactionId = capture.TransactionId ?? request.PaypalOrderId;
            order.Status = OrderStatus.Paid;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                transactionId = order.Payment.TransactionId,
                status = order.Payment.Status
            });
        }
        catch (Exception ex)
        {
            try
            {
                var statusCheck = await _payPalService.GetOrderStatusAsync(request.PaypalOrderId);
                if (statusCheck.Success)
                {
                    order.Payment.Status = PaymentStatus.Completed;
                    order.Payment.PaidAt ??= DateTime.UtcNow;
                    order.Payment.TransactionId = statusCheck.TransactionId ?? request.PaypalOrderId;
                    order.Status = OrderStatus.Paid;
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        transactionId = order.Payment.TransactionId,
                        status = order.Payment.Status,
                        message = "PayPal order was already captured."
                    });
                }
            }
            catch
            {
            }

            order.Payment.Status = PaymentStatus.Failed;
            await _context.SaveChangesAsync();
            return BadRequest(new { error = ex.Message });
        }
    }
}