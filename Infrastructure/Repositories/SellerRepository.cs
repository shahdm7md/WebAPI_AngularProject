using Core.Entities;
using Core.Interfaces.Repositories;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using SharedKernel.Enums;

namespace Infrastructure.Repositories;

public class SellerRepository : ISellerRepository
{
    private readonly AppDbContext _context;

    public SellerRepository(AppDbContext context)
    {
        _context = context;
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    public async Task<ApplicationUser?> GetSellerByIdAsync(string sellerId)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == sellerId && u.IsActive);
    }

    public async Task UpdateSellerAsync(ApplicationUser seller)
    {
        _context.Users.Update(seller);
        await _context.SaveChangesAsync();
    }

    // ── Products ──────────────────────────────────────────────────────────────

    public async Task<List<Product>> GetSellerProductsAsync(string sellerId)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Reviews)
            .Where(p => p.SellerId == sellerId && p.IsActive)
            .OrderByDescending(p => p.Id)
            .ToListAsync();

    }
    //public async Task<List<Product>> GetSellerProductsAsync(string sellerId)
    //{
    //    // TODO: Remove this seed data after fixing the real query
    //    var seedProducts = new List<Product>
    //{
    //    new Product
    //    {
    //        Id = 1,
    //        Name = "Eames Heritage Lounge Chair",
    //        Description = "Classic mid-century modern lounge chair with premium leather.",
    //        Price = 4250.00m,
    //        StockQuantity = 42,
    //        SellerId = sellerId,
    //        CategoryId = 1,
    //        IsActive = true,
    //        IsAvailable = true,
    //        Category = new Category { Id = 1, Name = "Furniture" },
    //        Images = new List<ProductImage>
    //        {
    //            new ProductImage
    //            {
    //                Id = 101,
    //                ProductId = 1,
    //                ImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuB4LJrN5MXXavtNauGBhs5w5AkJilBIds47Nw2OwC91ryZK-DDLvhTAng1jsTv4dG9nrx3PiJx4wE8pHmYLDRAJobqI8s0VAzR3KPslukm0BiR9sSbzRRnyCj8G8Pfd1_TGBuzq71ymuW6_yAue6bCsSobg10AXLsTy9zlH0LnWqE1eUnZFN62NUcFr3l757wmfosFuBw2ym04Y-GFG7AmiDlRstDyf4svdFEq64BqLBupthRWUZfxJxInLBSnklCw-rzvYyskXj7M",
    //                IsMain = true
    //            }
    //        },
    //        Reviews = new List<Review>()
    //    },
    //    new Product
    //    {
    //        Id = 2,
    //        Name = "Brutalist Monolith Lamp",
    //        Description = "Handcrafted concrete and brass table lamp.",
    //        Price = 890.00m,
    //        StockQuantity = 3,
    //        SellerId = sellerId,
    //        CategoryId = 2,
    //        IsActive = true,
    //        IsAvailable = true,
    //        Category = new Category { Id = 2, Name = "Lighting" },
    //        Images = new List<ProductImage>
    //        {
    //            new ProductImage
    //            {
    //                Id = 102,
    //                ProductId = 2,
    //                ImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAo7NajgsVlO7_6M8gEfHfwIIQl4OpoquwhCmtmBv_TdqmNn4dVZLJKaN5s7XNT4OYwCHn5lC_evGVsaU6YWszbNF4S-6xHDFpE1lB87nD-8fUU4Ri5kznbn9N9-7oRZ7ycnmVsf9t-QYFkF-PLgKe0y_hzl6gZACJcUwUVYPrjvAFB-ED9BfCH3U5OhwmhZ7ZIS8IOz3oAG4TUmmR3WtC_feG-GOzk0OG2-yX6bU792wj3b78z5OfFKy7gy2Vj9IuhwleMweymH6Q",
    //                IsMain = true
    //            }
    //        },
    //        Reviews = new List<Review>()
    //    },
    //    new Product
    //    {
    //        Id = 3,
    //        Name = "Carrara Marble Display Plinth",
    //        Description = "Elegant Italian marble pedestal for sculptures.",
    //        Price = 1120.00m,
    //        StockQuantity = 18,
    //        SellerId = sellerId,
    //        CategoryId = 3,
    //        IsActive = true,
    //        IsAvailable = true,
    //        Category = new Category { Id = 3, Name = "Decor" },
    //        Images = new List<ProductImage>
    //        {
    //            new ProductImage
    //            {
    //                Id = 103,
    //                ProductId = 3,
    //                ImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCfmi-hOX068mmRwQBgZIg8ElFqV9F9iqc2OZp1umW_lPZTfPBePG-pm707mtF2B8Dnp0RBfepYABDrnbvTkXQ0cyx6_U4I5AwxbcHT4eHHC8J1KrKLpLhmwYnOd4F_epD8-u7wumz-wRtvwxz7Rj4s0HJmWjKEcpA_nGDOtX_wSHupiy7KjDEKIDHbqTR63YBvtRPZyEqYAlh47qDIHAW9nKvZbONr43_iCaoAZNhM9SGnMjyQ_w8yOUlbODhel5s8bqury04izys",
    //                IsMain = true
    //            }
    //        },
    //        Reviews = new List<Review>()
    //    }
    //};

    //    return await Task.FromResult(seedProducts); // Return seed data for testing
    //}
    public async Task<Product?> GetSellerProductByIdAsync(int productId, string sellerId)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Id == productId && p.SellerId == sellerId);
    }

    public async Task<Product> CreateProductAsync(Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task UpdateProductAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteProductAsync(Product product)
    {
        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
    }

    // ── Product Images ────────────────────────────────────────────────────────

    public async Task<ProductImage> AddProductImageAsync(ProductImage image)
    {
        _context.ProductImages.Add(image);
        await _context.SaveChangesAsync();
        return image;
    }

    public async Task<ProductImage?> GetProductImageAsync(int imageId, int productId)
    {
        return await _context.ProductImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId);
    }

    public async Task DeleteProductImageAsync(ProductImage image)
    {
        _context.ProductImages.Remove(image);
        await _context.SaveChangesAsync();
    }

    public async Task ClearMainImageFlagAsync(int productId)
    {
        await _context.ProductImages
            .Where(i => i.ProductId == productId && i.IsMain)
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.IsMain, false));
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    public async Task<List<Order>> GetSellerOrdersAsync(
        string sellerId, string? status = null)
    {
        var query = _context.Orders
            .Include(o => o.User)
            .Include(o => o.Payment)
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p!.Images)
            .Where(o => o.Items.Any(oi =>
                oi.Product != null && oi.Product.SellerId == sellerId))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
            query = query.Where(o => o.Status == parsedStatus);

        return await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
    }

    public async Task<Order?> GetSellerOrderByIdAsync(int orderId, string sellerId)
    {
        return await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Payment)
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p!.Images)
            .FirstOrDefaultAsync(o =>
                o.Id == orderId &&
                o.Items.Any(oi => oi.Product != null && oi.Product.SellerId == sellerId));
    }

    public async Task UpdateOrderAsync(Order order)
    {
        _context.Orders.Update(order);
        await _context.SaveChangesAsync();
    }

    // ── Earnings ──────────────────────────────────────────────────────────────

    public async Task<List<Order>> GetSellerCompletedOrdersAsync(string sellerId)
    {
        return await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
            .Where(o =>
                o.Status == OrderStatus.Delivered &&
                o.Items.Any(oi => oi.Product != null && oi.Product.SellerId == sellerId))
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }
}