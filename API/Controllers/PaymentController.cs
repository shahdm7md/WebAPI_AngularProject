using Core.DTOs.Payment;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpPost("create-session")]
    public async Task<IActionResult> CreateSession([FromBody] CreateStripeSessionRequestDto request)
    {
        var session = await _paymentService.CreateStripeSessionAsync(GetUserId(), request.OrderId);
        return Ok(session);
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] ConfirmPaymentRequestDto request)
    {
        await _paymentService.ConfirmPaymentAsync(GetUserId(), request.OrderId, request.SessionId);
        return Ok(new { message = "Payment confirmed." });
    }

    [HttpPost("cash")]
    public async Task<IActionResult> Cash([FromBody] CashPaymentRequestDto request)
    {
        await _paymentService.CashPaymentAsync(GetUserId(), request.OrderId);
        return Ok(new { message = "Cash payment recorded." });
    }
}
