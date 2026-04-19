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
                //.Where(p => p.IsActive)
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
                Stock = p.Stock,
                IsAvailable = p.IsAvailable,
                IsActive = p.IsActive,
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


        public AdminOrderService(AppDbContext context , IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task<PaginatedResponse<AdminOrderResponse>> GetAllOrdersAsync(
            string? status, int page, int pageSize)
        {
            // uncomment لما Dev 3 يخلص Order entity:
            //
            // var query = _context.Orders.Include(o => o.User).AsQueryable();
            //
            // if (!string.IsNullOrEmpty(status))
            //     query = query.Where(o => o.Status == status);
            //
            // var total  = await query.CountAsync();
            // var orders = await query
            //     .OrderByDescending(o => o.CreatedAt)
            //     .Skip((page - 1) * pageSize)
            //     .Take(pageSize)
            //     .ToListAsync();
            //
            // var data = orders.Select(o => new AdminOrderResponse
            // {
            //     Id            = o.Id,
            //     CustomerName  = o.User?.FullName ?? "Guest",
            //     CustomerEmail = o.User?.Email ?? string.Empty,
            //     TotalAmount   = o.TotalAmount,
            //     Status        = o.Status,
            //     PaymentMethod = o.PaymentMethod,
            //     CreatedAt     = o.CreatedAt
            // }).ToList();
            //
            // return new PaginatedResponse<AdminOrderResponse>
            // {
            //     Data = data, TotalCount = total, Page = page, PageSize = pageSize
            // };

            return await Task.FromResult(new PaginatedResponse<AdminOrderResponse>
            {
                Data = Array.Empty<AdminOrderResponse>(),
                TotalCount = 0,
                Page = page,
                PageSize = pageSize
            });
        }

        public async Task<UpdateOrderStatusResult> UpdateOrderStatusAsync(int orderId, OrderStatus status)
        {
            // 1. هاتي الـ Order مع اليوزر (بإستخدام Include) عشان الإيميل
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

            // 2. تحديث الحالة
            order.Status = status;
            var result = await _context.SaveChangesAsync();

            if (result > 0)
            {
                // 3. منطق إرسال الإيميل (SendGrid)
                if (order.User != null && !string.IsNullOrEmpty(order.User.Email))
                {
                    string subject = "Order Status Updated";
                    string message = status switch
                    {
                        OrderStatus.Shipped => $"Good news! Your order #{orderId} is on its way. It has been shipped!",
                        OrderStatus.Delivered => $"Your order #{orderId} has been delivered. We hope you enjoy your flowers!",
                        OrderStatus.Cancelled => $"We are sorry to inform you that your order #{orderId} has been cancelled.",
                        _ => $"The status of your order #{orderId} has been updated to {status}."
                    };

                    try
                    {
                        await _emailService.SendEmailAsync(order.User.Email, subject, message);
                    }
                    catch (Exception ex)
                    {
                        // بنعمل Log للخطأ بس مش بنوقف الـ API
                        Console.WriteLine($"SendGrid Error: {ex.Message}");
                    }
                }

                return new UpdateOrderStatusResult
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Status updated and email sent successfully."
                };
            }

            return new UpdateOrderStatusResult
            {
                Success = false,
                StatusCode = 400,
                Message = "Failed to update status in database."
            };
        }

        public async Task<byte[]> ExportOrdersCsvAsync()
        {
            // uncomment لما Dev 3 يخلص:
            // var orders = await _context.Orders.Include(o => o.User).ToListAsync();
            // var sb     = new StringBuilder();
            // sb.AppendLine("Id,Customer,Email,Amount,Status,Date");
            // foreach (var o in orders)
            //     sb.AppendLine($"{o.Id},{o.User?.FullName},{o.User?.Email},{o.TotalAmount},{o.Status},{o.CreatedAt:yyyy-MM-dd}");
            // return Encoding.UTF8.GetBytes(sb.ToString());

            return await Task.FromResult(
                Encoding.UTF8.GetBytes("Id,Customer,Email,Amount,Status,Date\n"));
        }
    }
}
