using API.Contracts.Admin;
using Core.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace API.Services;

public sealed class AdminService : IAdminService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<IReadOnlyCollection<SellerSummaryResponse>> GetSellersAsync()
    {
        var sellers = await _userManager.GetUsersInRoleAsync("Seller");

        return sellers
            .OrderByDescending(user => user.CreatedAt)
            .Select(ToSellerSummary)
            .ToArray();
    }

    public async Task<ApproveSellerResult> ApproveSellerAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return new ApproveSellerResult
            {
                Success = false,
                StatusCode = StatusCodes.Status404NotFound,
                Message = "Seller account was not found."
            };
        }

        var isSeller = await _userManager.IsInRoleAsync(user, "Seller");
        if (!isSeller)
        {
            return new ApproveSellerResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "The specified user is not a seller account."
            };
        }

        if (user.IsActive)
        {
            return new ApproveSellerResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "Seller account is already approved.",
                Seller = ToSellerSummary(user)
            };
        }

        user.IsActive = true;
        user.SellerStatus = "Approved";

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return new ApproveSellerResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "Failed to approve seller account.",
                Seller = ToSellerSummary(user)
            };
        }

        return new ApproveSellerResult
        {
            Success = true,
            StatusCode = StatusCodes.Status200OK,
            Message = "Seller account approved successfully.",
            Seller = ToSellerSummary(user)
        };
    }

    private static SellerSummaryResponse ToSellerSummary(ApplicationUser user)
    {
        return new SellerSummaryResponse
        {
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            StoreName = user.StoreName ?? string.Empty,
            IsActive = user.IsActive,
            SellerStatus = user.SellerStatus ?? string.Empty
        };
    }
}
