using API.Contracts.Profile;
using Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public sealed class UserProfileService : IUserProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UserProfileService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<UserProfileResponse> GetUserProfileAsync(string userId)
    {
        var user = await _userManager.Users
            .Include(u => u.Orders) // لازم نعمل Include للأوردرات عشان نحسبها
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return null;

        return new UserProfileResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Address = user.Address,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,

            // هنا السر: بنحسب الأوردرات "المدفوعة" أو "المكتملة" فقط
            TotalOrders = user.Orders.Count(),

            // بنجمع إجمالي المبالغ اللي دفعها
            TotalSpent = user.Orders.Sum(o => o.TotalAmount)
        };
    }

    public async Task<UpdateProfileResult> UpdateProfileAsync(string userId, UpdateProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return new UpdateProfileResult
            {
                Success = false,
                StatusCode = StatusCodes.Status404NotFound,
                Message = "User not found."
            };

        if (string.IsNullOrWhiteSpace(request.FullName))
            return new UpdateProfileResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "Full name is required."
            };

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.PhoneNumber?.Trim();
        user.Address = request.Address?.Trim();

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return new UpdateProfileResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = errors
            };
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Customer";
        var totalOrders = user.Orders?.Count ?? 0;
        var totalSpent = user.Orders?.Sum(o => o.TotalAmount) ?? 0m;

        return new UpdateProfileResult
        {
            Success = true,
            StatusCode = StatusCodes.Status200OK,
            Message = "Profile updated successfully.",
            Profile = ToResponse(user, role, totalOrders, totalSpent)
        };
    }

    public async Task<ChangePasswordResult> ChangePasswordAsync(string userId, ChangePasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return new ChangePasswordResult
            {
                Success = false,
                StatusCode = StatusCodes.Status404NotFound,
                Message = "User not found."
            };

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword))
            return new ChangePasswordResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "Current and new passwords are required."
            };

        if (request.NewPassword.Length < 8)
            return new ChangePasswordResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "New password must be at least 8 characters."
            };

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return new ChangePasswordResult
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = errors
            };
        }

        return new ChangePasswordResult
        {
            Success = true,
            StatusCode = StatusCodes.Status200OK,
            Message = "Password changed successfully."
        };
    }

    private static UserProfileResponse ToResponse(
        ApplicationUser user, string role,
        int totalOrders, decimal totalSpent)
    {
        return new UserProfileResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Address = user.Address,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            TotalOrders = totalOrders,
            TotalSpent = totalSpent,
            Role = role
        };
    }
}