using Core.DTOs.Order;
using Core.Interfaces;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class CheckoutController : ControllerBase
{
    private readonly ICheckoutService _checkoutService;
    private readonly ICouponService _couponService;

    public CheckoutController(ICheckoutService checkoutService, ICouponService couponService)
    {
        _checkoutService = checkoutService;
        _couponService = couponService;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // GET api/checkout/summary
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var summary = await _checkoutService.GetOrderSummaryAsync(GetUserId());
        return Ok(summary);
    }

    // POST api/checkout
    [HttpPost]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequestDto dto)
    {
        var order = await _checkoutService.CheckoutAsync(GetUserId(), dto);
        return Ok(order);
    }

    // POST api/checkout/validate-coupon
    [HttpPost("validate-coupon")]
    public async Task<IActionResult> ValidateCoupon([FromBody] CouponValidationRequestDto request)
    {
        try
        {
            var result = await _couponService.ValidateAsync(GetUserId(), request.CouponCode);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}