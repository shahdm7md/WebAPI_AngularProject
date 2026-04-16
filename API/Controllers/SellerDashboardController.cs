using API.Contracts.Seller;
using Core.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Seller,Admin")]
public class SellerDashboardController : ControllerBase
{
    private readonly ISellerService _sellerService;

    public SellerDashboardController(ISellerService sellerService)
    {
        _sellerService = sellerService;
    }

    private string SellerId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("test")]
    public IActionResult Get() => Ok(new { message = "Seller Dashboard API is running." });

    // ── Profile ───────────────────────────────────────────────────────────────

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _sellerService.GetProfileAsync(SellerId);
        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateSellerProfileRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _sellerService.UpdateProfileAsync(SellerId, request);
        return Ok(result);
    }

    // ── Products ──────────────────────────────────────────────────────────────

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts()
    {
        var result = await _sellerService.GetProductsAsync(SellerId);
        if (result == null || !result.Any()) return Ok("No products found for this seller.");
        return Ok(result);

        
    }

    [HttpPost("products")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateProduct([FromForm] CreateSellerProductRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _sellerService.CreateProductAsync(SellerId, request);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
    }

    [HttpGet("products/{id:int}")]
    public async Task<IActionResult> GetProductById(int id)
    {
        var result = await _sellerService.GetProductByIdAsync(id, SellerId);
        return Ok(result);
    }

    [HttpPut("products/{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateSellerProductRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _sellerService.UpdateProductAsync(id, SellerId, request);
        return Ok(result);
    }

    [HttpDelete("products/{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        await _sellerService.DeleteProductAsync(id, SellerId);
        return NoContent();
    }

    [HttpPatch("products/{id:int}/stock")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _sellerService.UpdateStockAsync(id, SellerId, request);
        return Ok(result);
    }

    // ── Product Images ────────────────────────────────────────────────────────

    [HttpPost("products/{id:int}/images")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> AddProductImage(int id, [FromForm] AddProductImageRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _sellerService.AddProductImageAsync(id, SellerId, request);
        return Ok(result);
    }

    [HttpDelete("products/{id:int}/images/{imageId:int}")]
    public async Task<IActionResult> DeleteProductImage(int id, int imageId)
    {
        await _sellerService.DeleteProductImageAsync(id, SellerId, imageId);
        return NoContent();
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
    {
        var result = await _sellerService.GetOrdersAsync(SellerId, status);
        return Ok(result);
    }

    [HttpGet("orders/{id:int}")]
    public async Task<IActionResult> GetOrderById(int id)
    {
        var result = await _sellerService.GetOrderByIdAsync(id, SellerId);
        return Ok(result);
    }

    [HttpPatch("orders/{id:int}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _sellerService.UpdateOrderStatusAsync(id, SellerId, request);
        return Ok(result);
    }

    // ── Earnings ──────────────────────────────────────────────────────────────

    [HttpGet("earnings/summary")]
    public async Task<IActionResult> GetEarningsSummary()
    {
        var result = await _sellerService.GetEarningsSummaryAsync(SellerId);
        return Ok(result);
    }

    [HttpGet("earnings")]
    public async Task<IActionResult> GetEarningsDetail()
    {
        var result = await _sellerService.GetEarningsDetailAsync(SellerId);
        return Ok(result);
    }
}