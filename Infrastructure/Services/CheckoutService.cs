using Core.DTOs.Order;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using SharedKernel.Enums;

namespace Infrastructure.Services;

public class CheckoutService : ICheckoutService
{
    private readonly AppDbContext _context;

    public CheckoutService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<OrderResponseDto> CheckoutAsync(string userId, CheckoutRequestDto dto)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p!.Images)
            .FirstOrDefaultAsync(c => c.UserId == userId)
            ?? throw new InvalidOperationException("Cart is empty.");

        if (!cart.Items.Any())
            throw new InvalidOperationException("Cannot checkout with empty cart.");

        // Validate governorate
        var governorate = await _context.Governorates.FindAsync(dto.GovernorateId)
            ?? throw new KeyNotFoundException("Invalid governorate selected.");

        if (!governorate.IsActive)
            throw new InvalidOperationException("Selected governorate is not available.");

        decimal subtotal = 0;
        foreach (var item in cart.Items)
        {
            var product = item.Product!;
            if (product.StockQuantity < item.Quantity)
                throw new InvalidOperationException(
                    $"Insufficient stock for product: {product.Name}");
            subtotal += product.Price * item.Quantity;
        }

        decimal discount = 0;
        string? appliedCoupon = null;
        if (!string.IsNullOrEmpty(dto.CouponCode))
        {
            var result = await ApplyCouponAsync(userId, dto.CouponCode, subtotal);
            discount = result.Item1;
            appliedCoupon = result.Item2;
        }

        decimal total = subtotal - discount + governorate.ShippingCost;

        var order = new Order
        {
            UserId = userId,
            TotalAmount = total,
            ShippingCost = governorate.ShippingCost,
            DiscountAmount = discount,
            AppliedCouponCode = appliedCoupon,
            GovernorateId = dto.GovernorateId,
            ShippingFirstName = dto.ShippingFirstName,
            ShippingLastName = dto.ShippingLastName,
            ShippingPhone = dto.ShippingPhone,
            ShippingAddress = dto.ShippingAddress,
            ShippingCity = dto.ShippingCity,
            ShippingState = dto.ShippingState,
            ShippingZipCode = dto.ShippingZipCode,
            Status = OrderStatus.Pending,
            Items = cart.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                Price = i.Product!.Price,
                Product = i.Product
            }).ToList()
        };

        _context.Orders.Add(order);

        foreach (var item in cart.Items)
            item.Product!.StockQuantity -= item.Quantity;

        var payment = new Payment
        {
            Order = order,
            PaymentMethod = dto.PaymentMethod,
            Status = PaymentStatus.Pending,
            TransactionId = null,
            PaidAt = null
        };

        _context.Payments.Add(payment);

        _context.CartItems.RemoveRange(cart.Items);

        await _context.SaveChangesAsync();

        return MapToDto(order, payment, subtotal);
    }

    public async Task<OrderResponseDto> GetOrderSummaryAsync(string userId)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p!.Images)
            .FirstOrDefaultAsync(c => c.UserId == userId)
            ?? throw new InvalidOperationException("No cart found.");

        var previewOrder = new Order
        {
            UserId = userId,
            TotalAmount = cart.Items.Sum(i => i.Product!.Price * i.Quantity),
            ShippingCost = 0,
            DiscountAmount = 0,
            AppliedCouponCode = null,
            GovernorateId = 0,
            ShippingFirstName = string.Empty,
            ShippingLastName = string.Empty,
            ShippingPhone = string.Empty,
            ShippingAddress = string.Empty,
            ShippingCity = string.Empty,
            ShippingState = string.Empty,
            ShippingZipCode = string.Empty,
            Items = cart.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                Price = i.Product!.Price,
                Product = i.Product
            }).ToList()
        };

        return MapToDto(previewOrder, null, previewOrder.TotalAmount);
    }

    // ============ Private Helpers ============

    private async Task<(decimal, string)> ApplyCouponAsync(string userId, string code, decimal subtotal)
    {
        var coupon = await _context.Coupons
            .Include(c => c.Usages)
            .FirstOrDefaultAsync(c => c.Code == code)
            ?? throw new KeyNotFoundException("Coupon not found.");

        if (coupon.ExpiryDate < DateTime.UtcNow)
            throw new InvalidOperationException("Coupon has expired.");

        if (coupon.Usages.Count >= coupon.UsageLimit)
            throw new InvalidOperationException("Coupon usage limit reached.");

        bool alreadyUsed = coupon.Usages.Any(u => u.UserId == userId);
        if (alreadyUsed)
            throw new InvalidOperationException("You have already used this coupon.");

        if (coupon.MinOrderAmount.HasValue && subtotal < coupon.MinOrderAmount.Value)
            throw new InvalidOperationException($"Coupon requires minimum order of {coupon.MinOrderAmount}.");

        decimal discount = coupon.DiscountType == SharedKernel.Enums.DiscountType.Percentage
            ? subtotal * (coupon.Value / 100)
            : coupon.Value;

        _context.CouponUsages.Add(new CouponUsage
        {
            CouponId = coupon.Id,
            UserId = userId
        });

        return (Math.Max(0, discount), code);
    }

    private static OrderResponseDto MapToDto(Order order, Payment? payment, decimal subtotalAmount)
    {
        return new OrderResponseDto
        {
            Id = order.Id,
            SubtotalAmount = subtotalAmount,
            TotalAmount = order.TotalAmount,
            ShippingCost = order.ShippingCost,
            DiscountAmount = order.DiscountAmount,
            AppliedCouponCode = order.AppliedCouponCode,
            ShippingFirstName = order.ShippingFirstName,
            ShippingLastName = order.ShippingLastName,
            ShippingPhone = order.ShippingPhone,
            ShippingAddress = order.ShippingAddress,
            ShippingCity = order.ShippingCity,
            ShippingState = order.ShippingState,
            ShippingZipCode = order.ShippingZipCode,
            Status = order.Status,
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(i => new OrderItemResponseDto
            {
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? string.Empty,
                ProductImage = i.Product?.Images.FirstOrDefault(img => img.IsMain)?.ImageUrl,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList(),
            Payment = payment is null ? null : new PaymentResponseDto
            {
                Id = payment.Id,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                TransactionId = payment.TransactionId,
                PaidAt = payment.PaidAt
            }
        };
    }
}