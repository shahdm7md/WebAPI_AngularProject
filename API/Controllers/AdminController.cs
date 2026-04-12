using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public sealed class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("sellers")]
    public async Task<IActionResult> GetSellers()
    {
        var sellers = await _adminService.GetSellersAsync();

        return Ok(new
        {
            message = "Sellers retrieved successfully.",
            count = sellers.Count,
            sellers
        });
    }

    [HttpPut("approve-seller/{userId}")]
    public async Task<IActionResult> ApproveSeller(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new { message = "Seller userId is required." });
        }

        var result = await _adminService.ApproveSellerAsync(userId);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new { message = result.Message, seller = result.Seller });
        }

        return Ok(new { message = result.Message, seller = result.Seller });
    }
}