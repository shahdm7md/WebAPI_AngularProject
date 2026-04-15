using API.Contracts.Admin;
using Core.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public sealed class AdminService : IAdminService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _context;

    public AdminService(UserManager<ApplicationUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    // --------- Dashboard Stats ---------
    public async Task<DashboardStatsResponse> GetDashboardStatsAsync()
    {
        var totalUsers = await _context.Users.CountAsync(u => u.IsActive);
        var activeSellers = await _context.Users.CountAsync(u => u.IsActive && u.SellerStatus == "Approved");
        var pendingSellers = await _context.Users.CountAsync(u => u.SellerStatus == "Pending");

        // ???? — ?????? ??? Dev 2 ? Dev 3 ??????
        // var today            = DateTime.UtcNow.Date;
        // var totalOrders      = await _context.Orders.CountAsync();
        // var totalOrdersToday = await _context.Orders.CountAsync(o => o.CreatedAt.Date == today);
        // var netRevenue       = await _context.Orders.Where(o => o.Status == "Completed").SumAsync(o => o.TotalAmount);
        // var lowStock         = await _context.Products.CountAsync(p => p.IsActive && p.Stock < 5);

        return new DashboardStatsResponse
        {
            TotalUsers = totalUsers,
            ActiveSellers = activeSellers,
            PendingSellers = pendingSellers,
            TotalOrders = 0,
            TotalOrdersToday = 0,
            NetRevenue = 0,
            LowStockProducts = 0
        };
    }

    // --------- Get All Users (Paginated) ---------
    public async Task<PaginatedResponse<UserSummaryResponse>> GetAllUsersAsync(
        string? role, int page, int pageSize)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role))
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role);
            var ids = usersInRole.Select(u => u.Id).ToList();
            query = query.Where(u => ids.Contains(u.Id));
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = new List<UserSummaryResponse>();
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            dtos.Add(new UserSummaryResponse
            {
                Id = u.Id,
                FullName = u.FullName ?? string.Empty,
                Email = u.Email ?? string.Empty,
                PhoneNumber = u.PhoneNumber,
                Role = roles.FirstOrDefault() ?? "Customer",
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            });
        }

        return new PaginatedResponse<UserSummaryResponse>
        {
            Data = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    // --------- Get All Sellers ---------
    public async Task<IReadOnlyCollection<SellerSummaryResponse>> GetSellersAsync()
    {
        var sellers = await _userManager.GetUsersInRoleAsync("Seller");
        return sellers
            .OrderByDescending(u => u.CreatedAt)
            .Select(ToSellerSummary)
            .ToArray();
    }

    public async Task<IReadOnlyCollection<SellerSummaryResponse>> GetPendingSellersAsync()
    {
        var sellerRoleId = await _context.Roles
            .Where(r => r.Name == "Seller")
            .Select(r => r.Id)
            .FirstOrDefaultAsync();

        var pending = await _context.Users
            .Where(u => u.SellerStatus == "Pending" &&
                        _context.UserRoles.Any(ur =>
                            ur.UserId == u.Id && ur.RoleId == sellerRoleId))
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return pending.Select(ToSellerSummary).ToArray();
    }

    // --------- Approve Seller ---------
    public async Task<ApproveSellerResult> ApproveSellerAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return new ApproveSellerResult
            {
                Success = false,
                StatusCode = StatusCodes.Status404NotFound,
                Message = "Seller account was not found."
            };

        var isSeller = await _userManager.IsInRoleAsync(user, "Seller");
        if (!isSeller)
            return new ApproveSellerResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "The specified user is not a seller account."
            };

        if (user.IsActive)
            return new ApproveSellerResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "Seller account is already approved.",
                Seller = ToSellerSummary(user)
            };

        user.IsActive = true;
        user.SellerStatus = "Approved";
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
            return new ApproveSellerResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "Failed to approve seller account."
            };

        return new ApproveSellerResult
        {
            Success = true,
            StatusCode = StatusCodes.Status200OK,
            Message = "Seller account approved successfully.",
            Seller = ToSellerSummary(user)
        };
    }

    // --------- Reject Seller ---------
    public async Task<RejectSellerResult> RejectSellerAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return new RejectSellerResult
            {
                Success = false,
                StatusCode = StatusCodes.Status404NotFound,
                Message = "Seller account was not found."
            };

        user.SellerStatus = "Rejected";
        user.IsActive = false;
        await _userManager.UpdateAsync(user);

        return new RejectSellerResult
        {
            Success = true,
            StatusCode = StatusCodes.Status200OK,
            Message = "Seller account rejected."
        };
    }

    // --------- Toggle Active ---------
    public async Task<ToggleActiveResult> ToggleActiveAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return new ToggleActiveResult
            {
                Success = false,
                StatusCode = StatusCodes.Status404NotFound,
                Message = "User not found."
            };

        user.IsActive = !user.IsActive;
        await _userManager.UpdateAsync(user);

        return new ToggleActiveResult
        {
            Success = true,
            StatusCode = StatusCodes.Status200OK,
            Message = user.IsActive ? "User activated." : "User deactivated."
        };
    }

    // --------- Helper ---------
    private static SellerSummaryResponse ToSellerSummary(ApplicationUser user) =>
        new SellerSummaryResponse
        {
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName ?? string.Empty,
            StoreName = user.StoreName ?? string.Empty,
            IsActive = user.IsActive,
            SellerStatus = user.SellerStatus ?? string.Empty
        };
}
 

