using API.Contracts.Admin;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using SharedKernel.Enums;
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

        public AdminOrderService(AppDbContext context) => _context = context;

        public async Task<PaginatedResponse<AdminOrderResponse>> GetAllOrdersAsync(string? status, int page, int pageSize)
        {
            // 1. إنشاء الـ Query الأساسية مع Include للمستخدم لضمان ظهور الأسماء
            var query = _context.Orders.Include(o => o.User).AsQueryable();

            // 2. منطق الفلترة الاحترافي:
            // هنا بنحول الـ string اللي جاي من Angular (زي "0" أو "1") لرقم عشان نقارنه بالـ Enum في الداتا بيز
            if (!string.IsNullOrEmpty(status) && status != "All")
            {
                if (int.TryParse(status, out int statusInt))
                {
                    // المقارنة الرقمية هي اللي بتخلي الفلتر يشتغل صح في SQL
                    query = query.Where(o => (int)o.Status == statusInt);
                }
                else
                {
                    // احتياطاً لو الحالة مبعوثة كنص
                    query = query.Where(o => o.Status.ToString() == status);
                }
            }

            // 3. حساب العدد الإجمالي للمفلتر (عشان الـ Pagination يظهر صح)
            var total = await query.CountAsync();

            // 4. جلب البيانات بترتيب الأحدث مع تطبيق الـ Paging
            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 5. الـ Mapping للـ Response:
            // بنحول الـ Status لرقم نصي عشان الـ resolveStatus في Angular تفهمه وتظهر الألوان
            var data = orders.Select(o => new AdminOrderResponse
            {
                Id = o.Id,
                CustomerName = o.User?.FullName ?? "Guest",
                CustomerEmail = o.User?.Email ?? "N/A",
                TotalAmount = o.TotalAmount,
                // نرسل الرقم (0, 1, 2) كـ string لأن الـ Angular بيفك شفرته هناك
                Status = ((int)o.Status).ToString(),
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

        public async Task<UpdateOrderStatusResult> UpdateOrderStatusAsync(int orderId, string status)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order is null)
            {
                return new UpdateOrderStatusResult
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "Order not found."
                };
            }

            // لو الـ Status في الـ Entity نوعه Enum، لازم نعمل Parse للقيمة المبعوثة
            if (int.TryParse(status, out int statusInt))
            {
                order.Status = (OrderStatus)statusInt;
            }
            else
            {
                // لو مبعوثة نص، بنحولها لـ Enum
                if (Enum.TryParse<OrderStatus>(status, true, out var statusEnum))
                {
                    order.Status = statusEnum;
                }
            }

            await _context.SaveChangesAsync();
            return new UpdateOrderStatusResult { Success = true, StatusCode = 200, Message = "Status updated successfully." };
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