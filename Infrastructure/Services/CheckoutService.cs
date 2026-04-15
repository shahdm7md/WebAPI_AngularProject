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
            .FirstOrDefaultAsync(c => c.UserId == userId)
            ?? throw new InvalidOperationException("Cart is empty.");

        if (!cart.Items.Any())
            throw new InvalidOperationException("Cannot checkout with empty cart.");

        decimal total = 0;
        foreach (var item in cart.Items)
        {
            var product = item.Product!;
            if (product.StockQuantity < item.Quantity)
                throw new InvalidOperationException(
                    $"Insufficient stock for product: {product.Name}");
            total += product.Price * item.Quantity;
        }

        if (!string.IsNullOrEmpty(dto.CouponCode))
            total = await ApplyCouponAsync(userId, dto.CouponCode, total);

        var order = new Order
        {
            UserId = userId,
            TotalAmount = total,
            Status = OrderStatus.Pending,
            Items = cart.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                Price = i.Product!.Price
            }).ToList()
        };

        _context.Orders.Add(order);

        foreach (var item in cart.Items)
            item.Product!.StockQuantity -= item.Quantity;

        var payment = new Payment
        {
            Order = order,
            PaymentMethod = dto.PaymentMethod,
            Status = PaymentStatus.Completed,       // Mock → دايمًا Completed
            TransactionId = Guid.NewGuid().ToString(),
            PaidAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);

        _context.CartItems.RemoveRange(cart.Items);

        await _context.SaveChangesAsync();

        return MapToDto(order, payment);
    }

    public async Task<OrderResponseDto> GetOrderSummaryAsync(string userId)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId)
            ?? throw new InvalidOperationException("No cart found.");

        var previewOrder = new Order
        {
            UserId = userId,
            TotalAmount = cart.Items.Sum(i => i.Product!.Price * i.Quantity),
            Items = cart.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                Price = i.Product!.Price
            }).ToList()
        };

        return MapToDto(previewOrder, null);
    }

    // ============ Private Helpers ============

    private async Task<decimal> ApplyCouponAsync(string userId, string code, decimal total)
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

        decimal discount = coupon.DiscountType == SharedKernel.Enums.DiscountType.Percentage
            ? total * (coupon.Value / 100)
            : coupon.Value;

        _context.CouponUsages.Add(new CouponUsage
        {
            CouponId = coupon.Id,
            UserId = userId
        });

        return Math.Max(0, total - discount);
    }

    private static OrderResponseDto MapToDto(Order order, Payment? payment)
    {
        return new OrderResponseDto
        {
            Id = order.Id,
            TotalAmount = order.TotalAmount,
            Status = order.Status,
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(i => new OrderItemResponseDto
            {
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? string.Empty,
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