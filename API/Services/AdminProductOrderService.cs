using API.Contracts.Admin;
using Core.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using SharedKernel.Enums;
using System.Text;

namespace API.Services
{
    public sealed class AdminProductService : IAdminProductService
    {
        private readonly AppDbContext _context;

        public AdminProductService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PaginatedResponse<AdminProductResponse>> GetAllProductsAsync(
            string? sellerId, int page, int pageSize)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.IsActive)
                .AsQueryable();

            if (!string.IsNullOrEmpty(sellerId))
                query = query.Where(p => p.SellerId == sellerId);

            var total = await query.CountAsync();
            var products = await query
                .OrderByDescending(p => p.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var sellerIds = products.Select(p => p.SellerId).Distinct().ToList();
            var sellers = await _context.Users
                .Where(u => sellerIds.Contains(u.Id))
                .ToDictionaryAsync(
                    u => u.Id,
                    u => u.StoreName ?? u.FullName ?? u.Email ?? "Unknown");

            var data = products.Select(p => new AdminProductResponse
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                Stock = p.StockQuantity,
                IsAvailable = p.IsActive && p.StockQuantity > 0,
                IsActive = p.IsActive,
                MainImageUrl = p.Images
                    .OrderByDescending(i => i.IsMain)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault(),
                CategoryName = p.Category?.Name ?? string.Empty,
                SellerId = p.SellerId,
                SellerName = sellers.TryGetValue(p.SellerId, out var name) ? name : "Unknown"
            }).ToList();

            return new PaginatedResponse<AdminProductResponse>
            {
                Data = data,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<DeactivateProductResult> DeactivateProductAsync(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product is null)
                return new DeactivateProductResult
                {
                    Success = false,
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = "Product not found."
                };

            product.IsActive = false;
            product.IsAvailable = false;
            await _context.SaveChangesAsync();

            return new DeactivateProductResult
            {
                Success = true,
                StatusCode = StatusCodes.Status200OK,
                Message = "Product deactivated successfully."
            };
        }
    }

    // =================== Order Service ===================

    public sealed class AdminOrderService : IAdminOrderService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public AdminOrderService(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task<PaginatedResponse<AdminOrderResponse>> GetAllOrdersAsync(string? status, int page, int pageSize)
        {
            var query = _context.Orders.Include(o => o.User).AsQueryable();

            if (!string.IsNullOrEmpty(status) && status != "All")
            {
                if (int.TryParse(status, out int statusInt))
                {
                    query = query.Where(o => (int)o.Status == statusInt);
                }
                else
                {
                    query = query.Where(o => o.Status.ToString() == status);
                }
            }

            var total = await query.CountAsync();

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var data = orders.Select(o => new AdminOrderResponse
            {
                Id = o.Id,
                CustomerName = o.User?.FullName ?? "Guest",
                CustomerEmail = o.User?.Email ?? "N/A",
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                CreatedAt = o.CreatedAt
            }).ToList();

            return new PaginatedResponse<AdminOrderResponse>
            {
                Data = data,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<UpdateOrderStatusResult> UpdateOrderStatusAsync(int orderId, OrderStatus status)
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order is null)
            {
                return new UpdateOrderStatusResult
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "Order not found."
                };
            }

            order.Status = status;
            var result = await _context.SaveChangesAsync();

            if (result > 0)
            {
                if (order.User != null && !string.IsNullOrEmpty(order.User.Email))
                {
                    string subject = "Order Status Updated";
                    string message = status switch
                    {
                        OrderStatus.Shipped => $"Good news! Your order #{orderId} is on its way.",
                        OrderStatus.Delivered => $"Your order #{orderId} has been delivered.",
                        OrderStatus.Cancelled => $"Your order #{orderId} has been cancelled.",
                        _ => $"Order #{orderId} status updated to {status}."
                    };

                    try
                    {
                        await _emailService.SendEmailAsync(order.User.Email, subject, message);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Email Error: {ex.Message}");
                    }
                }

                return new UpdateOrderStatusResult
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Status updated successfully."
                };
            }

            return new UpdateOrderStatusResult
            {
                Success = false,
                StatusCode = 400,
                Message = "Failed to update status."
            };
        }

        public async Task<byte[]> ExportOrdersCsvAsync()
        {
            var orders = await _context.Orders.Include(o => o.User).ToListAsync();
            var sb = new StringBuilder();
            sb.AppendLine("Id,Customer,Email,Amount,Status,Date");

            foreach (var o in orders)
            {
                sb.AppendLine($"{o.Id},{o.User?.FullName ?? "Guest"},{o.User?.Email},{o.TotalAmount},{o.Status},{o.CreatedAt:yyyy-MM-dd}");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }
    }
}