using API.Contracts.Admin;
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
    private readonly IAdminProductService _productService;
    private readonly IAdminOrderService _orderService;

    public AdminController(
        IAdminService adminService,
        IAdminProductService productService,
        IAdminOrderService orderService)
    {
        _adminService = adminService;
        _productService = productService;
        _orderService = orderService;
    }

    // GET /api/admin/dashboard/stats
    [HttpGet("dashboard/stats")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _adminService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    // GET /api/admin/users?role=&page=&pageSize=
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _adminService.GetAllUsersAsync(role, page, pageSize);
        return Ok(result);
    }

    // GET /api/admin/sellers/pending
    [HttpGet("sellers/pending")]
    public async Task<IActionResult> GetPendingSellers()
    {
        var result = await _adminService.GetPendingSellersAsync();
        return Ok(result);
    }

    // PUT /api/admin/users/{id}/toggle-active
    [HttpPut("users/{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(string id)
    {
        var result = await _adminService.ToggleActiveAsync(id);
        return StatusCode(result.StatusCode, new { result.Message });
    }

    // PUT /api/admin/sellers/{id}/approve
    [HttpPut("sellers/{id}/approve")]
    public async Task<IActionResult> ApproveSeller(string id)
    {
        var result = await _adminService.ApproveSellerAsync(id);
        return StatusCode(result.StatusCode, result);
    }

    // PUT /api/admin/sellers/{id}/reject
    [HttpPut("sellers/{id}/reject")]
    public async Task<IActionResult> RejectSeller(string id)
    {
        var result = await _adminService.RejectSellerAsync(id);
        return StatusCode(result.StatusCode, new { result.Message });
    }

    // GET /api/admin/products?sellerId=&page=&pageSize=
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? sellerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _productService.GetAllProductsAsync(sellerId, page, pageSize);
        return Ok(result);
    }

    // PUT /api/admin/products/{id}/deactivate
    [HttpPut("products/{id}/deactivate")]
    public async Task<IActionResult> DeactivateProduct(int id)
    {
        var result = await _productService.DeactivateProductAsync(id);
        return StatusCode(result.StatusCode, new { result.Message });
    }

    // GET /api/admin/orders?status=&page=&pageSize=
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        // تحويل النص "0" إلى رقم إذا كان ممكناً، لضمان توافق الـ Filter
        // أو إرسال الحالة كما هي للـ Service
        var result = await _orderService.GetAllOrdersAsync(status, page, pageSize);
        return Ok(result);
    }

    // PUT /api/admin/orders/{id}/status
    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var result = await _orderService.UpdateOrderStatusAsync(id, request.Status);
        return StatusCode(result.StatusCode, new { result.Message });
    }

    // GET /api/admin/orders/export
    [HttpGet("orders/export")]
    public async Task<IActionResult> ExportOrders()
    {
        var csv = await _orderService.ExportOrdersCsvAsync();
        return File(csv, "text/csv", $"orders_{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}

// =================== Coupon Controller ===================
[ApiController]
[Route("api/admin/coupons")]
public sealed class CouponController : ControllerBase
{
    private readonly ICouponService _couponService;

    public CouponController(ICouponService couponService)
        => _couponService = couponService;

    // GET /api/admin/coupons  (public عشان الـ checkout)
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var result = await _couponService.GetAllAsync();
        return Ok(result);
    }

    // POST /api/admin/coupons
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCouponRequest request)
    {
        var result = await _couponService.CreateAsync(request);
        return StatusCode(result.StatusCode, result);
    }

    // PUT /api/admin/coupons/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCouponRequest request)
    {
        var result = await _couponService.UpdateAsync(id, request);
        return StatusCode(result.StatusCode, result);
    }

    // DELETE /api/admin/coupons/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _couponService.DeleteAsync(id);
        return StatusCode(result.StatusCode, new { result.Message });
    }
}

// =================== Banner Controller ===================
[ApiController]
[Route("api")]
public sealed class BannerController : ControllerBase
{
    private readonly IBannerService _bannerService;

    public BannerController(IBannerService bannerService)
        => _bannerService = bannerService;

    // GET /api/banners  (public)
    [HttpGet("banners")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var result = await _bannerService.GetAllAsync();
        return Ok(result);
    }

    // POST /api/admin/banners
    [HttpPost("admin/banners")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromForm] CreateBannerRequest request, IFormFile? image)
    {
        string imageUrl = string.Empty;

        if (image != null)
        {
            var folder = Path.Combine("wwwroot", "banners");
            Directory.CreateDirectory(folder);
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
            var filePath = Path.Combine(folder, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await image.CopyToAsync(stream);
            imageUrl = $"/banners/{fileName}";
        }

        var result = await _bannerService.CreateAsync(request, imageUrl);
        return StatusCode(result.StatusCode, result);
    }

    // PUT /api/admin/banners/{id}
    [HttpPut("admin/banners/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBannerRequest request)
    {
        var result = await _bannerService.UpdateAsync(id, request);
        return StatusCode(result.StatusCode, result);
    }

    // DELETE /api/admin/banners/{id}
    [HttpDelete("admin/banners/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _bannerService.DeleteAsync(id);
        return StatusCode(result.StatusCode, new { result.Message });
    }
}