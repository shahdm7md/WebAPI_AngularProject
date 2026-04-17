using API.Contracts.Admin;
using Core.Entities;
using Infrastructure.Persistence;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Core.DTOs.Order;

namespace API.Services
{
    public sealed class CouponService : ICouponService
    {
        private readonly AppDbContext _context;

        public CouponService(AppDbContext context) => _context = context;

        public async Task<IReadOnlyCollection<CouponResponse>> GetAllAsync()
        {
            var coupons = await _context.Coupons
                .Include(c => c.Usages)
                .OrderByDescending(c => c.Id)
                .ToListAsync();

            return coupons.Select(ToResponse).ToArray();
        }

        public async Task<CouponResult> CreateAsync(CreateCouponRequest request)
        {
            var exists = await _context.Coupons
                .AnyAsync(c => c.Code == request.Code.ToUpper().Trim());

            if (exists)
                return new CouponResult
                {
                    Success = false,
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = "Coupon code already exists."
                };

            var coupon = new Coupon
            {
                Code = request.Code.ToUpper().Trim(),
                DiscountType = request.DiscountType,
                Value = request.Value,
                MinOrderAmount = request.MinOrderAmount,
                UsageLimit = request.UsageLimit,
                ExpiryDate = request.ExpiryDate,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();

            return new CouponResult
            {
                Success = true,
                StatusCode = StatusCodes.Status201Created,
                Message = "Coupon created successfully.",
                Coupon = ToResponse(coupon)
            };
        }

        public async Task<CouponResult> UpdateAsync(int id, UpdateCouponRequest request)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon is null)
                return new CouponResult
                {
                    Success = false,
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = "Coupon not found."
                };

            coupon.DiscountType = request.DiscountType;
            coupon.Value = request.Value;
            coupon.MinOrderAmount = request.MinOrderAmount;
            coupon.UsageLimit = request.UsageLimit;
            coupon.ExpiryDate = request.ExpiryDate;
            coupon.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return new CouponResult
            {
                Success = true,
                StatusCode = StatusCodes.Status200OK,
                Message = "Coupon updated successfully.",
                Coupon = ToResponse(coupon)
            };
        }

        public async Task<CouponResult> DeleteAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon is null)
                return new CouponResult
                {
                    Success = false,
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = "Coupon not found."
                };

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();

            return new CouponResult
            {
                Success = true,
                StatusCode = StatusCodes.Status200OK,
                Message = "Coupon deleted successfully."
            };
        }

        public async Task<CouponValidationResponseDto> ValidateAsync(string userId, string code)
        {
            var normalizedCode = code.Trim().ToUpper();
            var cart = await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId)
                ?? throw new InvalidOperationException("No cart found.");

            var subtotal = cart.Items.Sum(item => item.Product!.Price * item.Quantity);

            var coupon = await _context.Coupons
                .Include(c => c.Usages)
                .FirstOrDefaultAsync(c => c.Code == normalizedCode)
                ?? throw new KeyNotFoundException("Coupon not found.");

            if (!coupon.IsActive)
                throw new InvalidOperationException("Coupon is inactive.");

            if (coupon.ExpiryDate < DateTime.UtcNow)
                throw new InvalidOperationException("Coupon has expired.");

            if (coupon.Usages.Count >= coupon.UsageLimit)
                throw new InvalidOperationException("Coupon usage limit reached.");

            if (coupon.Usages.Any(usage => usage.UserId == userId))
                throw new InvalidOperationException("You have already used this coupon.");

            if (coupon.MinOrderAmount.HasValue && subtotal < coupon.MinOrderAmount.Value)
                throw new InvalidOperationException($"Coupon requires minimum order of {coupon.MinOrderAmount}.");

            var discount = coupon.DiscountType == SharedKernel.Enums.DiscountType.Percentage
                ? subtotal * (coupon.Value / 100)
                : coupon.Value;

            discount = Math.Min(discount, subtotal);

            return new CouponValidationResponseDto
            {
                IsValid = true,
                Message = "Coupon is valid.",
                CouponCode = coupon.Code,
                DiscountAmount = discount
            };
        }

        private static CouponResponse ToResponse(Coupon c) => new CouponResponse
        {
            Id = c.Id,
            Code = c.Code,
            DiscountType = c.DiscountType,
            Value = c.Value,
            MinOrderAmount = c.MinOrderAmount,
            UsageLimit = c.UsageLimit,
            UsedCount = c.Usages.Count,
            ExpiryDate = c.ExpiryDate,
            IsActive = c.IsActive
        };
    }

    // =================== Banner Service ===================
    public sealed class BannerService : IBannerService
    {
        private readonly AppDbContext _context;

        public BannerService(AppDbContext context) => _context = context;

        public async Task<IReadOnlyCollection<BannerResponse>> GetAllAsync()
        {
            return await _context.Banners
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new BannerResponse
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageUrl = b.ImageUrl,
                    Link = b.Link,
                    IsActive = b.IsActive,
                    DisplayOrder = b.DisplayOrder
                })
                .ToArrayAsync();
        }

        public async Task<BannerResult> CreateAsync(CreateBannerRequest request, string imageUrl)
        {
            var banner = new Banner
            {
                Title = request.Title,
                ImageUrl = imageUrl,
                Link = request.Link,
                IsActive = true,
                DisplayOrder = request.DisplayOrder,
                CreatedAt = DateTime.UtcNow
            };

            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();

            return new BannerResult
            {
                Success = true,
                StatusCode = StatusCodes.Status201Created,
                Message = "Banner created successfully.",
                Banner = new BannerResponse
                {
                    Id = banner.Id,
                    Title = banner.Title,
                    ImageUrl = banner.ImageUrl,
                    Link = banner.Link,
                    IsActive = banner.IsActive,
                    DisplayOrder = banner.DisplayOrder
                }
            };
        }

        public async Task<BannerResult> UpdateAsync(int id, UpdateBannerRequest request)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner is null)
                return new BannerResult
                {
                    Success = false,
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = "Banner not found."
                };

            banner.Title = request.Title;
            banner.Link = request.Link;
            banner.IsActive = request.IsActive;
            banner.DisplayOrder = request.DisplayOrder;

            await _context.SaveChangesAsync();

            return new BannerResult
            {
                Success = true,
                StatusCode = StatusCodes.Status200OK,
                Message = "Banner updated successfully.",
                Banner = new BannerResponse
                {
                    Id = banner.Id,
                    Title = banner.Title,
                    ImageUrl = banner.ImageUrl,
                    Link = banner.Link,
                    IsActive = banner.IsActive,
                    DisplayOrder = banner.DisplayOrder
                }
            };
        }

        public async Task<BannerResult> DeleteAsync(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner is null)
                return new BannerResult
                {
                    Success = false,
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = "Banner not found."
                };

            // امسح الصورة من السيرفر
            if (!string.IsNullOrEmpty(banner.ImageUrl))
            {
                var fullPath = Path.Combine("wwwroot", banner.ImageUrl.TrimStart('/'));
                if (File.Exists(fullPath)) File.Delete(fullPath);
            }

            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();

            return new BannerResult
            {
                Success = true,
                StatusCode = StatusCodes.Status200OK,
                Message = "Banner deleted successfully."
            };
        }
    }
}
