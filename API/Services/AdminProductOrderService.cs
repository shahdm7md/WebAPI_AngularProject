using API.Contracts.Admin;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text;
namespace API.Services
{
    public sealed class AdminProductService : IAdminProductService
    {
        private readonly AppDbContext _context;

        public AdminProductService(AppDbContext context) => _context = context;

        public async Task<PaginatedResponse<AdminProductResponse>> GetAllProductsAsync(
            string? sellerId, int page, int pageSize)
        {
            var query = _context.Products
                .Include(p => p.Category)
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

        public AdminOrderService(AppDbContext context) => _context = context;

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

        public async Task<UpdateOrderStatusResult> UpdateOrderStatusAsync(int orderId, string status)
        {
            // uncomment لما Dev 3 يخلص:
            // var order = await _context.Orders.FindAsync(orderId);
            // if (order is null)
            //     return new UpdateOrderStatusResult
            //     {
            //         Success = false, StatusCode = 404, Message = "Order not found."
            //     };
            // order.Status = status;
            // await _context.SaveChangesAsync();
            // return new UpdateOrderStatusResult { Success = true, StatusCode = 200, Message = "Status updated." };

            return await Task.FromResult(new UpdateOrderStatusResult
            {
                Success = false,
                StatusCode = StatusCodes.Status503ServiceUnavailable,
                Message = "Orders module not ready yet."
            });
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
