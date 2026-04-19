using API.Contracts.Seller;
using API.Services;
using Core.Entities;
using Core.Interfaces;
using Core.Interfaces.Repositories;
using Core.Interfaces.Services;
using Microsoft.Extensions.Logging;
using SharedKernel.Enums;
using System.Security.Claims;

namespace Application.Services;

public class SellerService : ISellerService
{
    private readonly ISellerRepository _sellerRepo;
    private readonly IFileStorageService _fileStorage;
    private readonly IWebHostEnvironment _env;
    private readonly IEmailService _emailService;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<SellerService> _logger;

    public SellerService(
        ISellerRepository sellerRepo,
        IFileStorageService fileStorage,
        IEmailService emailService,
        IEmailSender emailSender,
        ILogger<SellerService> logger)
    {
        _sellerRepo = sellerRepo;
        _fileStorage = fileStorage;
        _emailService = emailService;
        _emailSender = emailSender;
        _logger = logger;
        _env = env;
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    public async Task<SellerProfileResponse> GetProfileAsync(string sellerId)
    {
        var seller = await _sellerRepo.GetSellerByIdAsync(sellerId)
            ?? throw new KeyNotFoundException("Seller not found.");

        return MapToProfileResponse(seller);
    }

    public async Task<SellerProfileResponse> UpdateProfileAsync(
        string sellerId, UpdateSellerProfileRequest request)
    {
        var seller = await _sellerRepo.GetSellerByIdAsync(sellerId)
            ?? throw new KeyNotFoundException("Seller not found.");

        seller.FullName         = request.FullName;
        seller.Address          = request.Address;
        seller.StoreName        = request.StoreName;
        seller.StoreDescription = request.StoreDescription;
        seller.PhoneNumber      = request.PhoneNumber;

        await _sellerRepo.UpdateSellerAsync(seller);
        return MapToProfileResponse(seller);
    }

    // ── Products ──────────────────────────────────────────────────────────────

    public async Task<List<SellerProductResponse>> GetProductsAsync(
        string sellerId)
    {
        var items = await _sellerRepo.GetSellerProductsAsync(sellerId);
        return items.Select(MapToProductResponse).ToList();
    }

    public async Task<SellerProductResponse> GetProductByIdAsync(int productId, string sellerId)
    {
        var product = await _sellerRepo.GetSellerProductByIdAsync(productId, sellerId);
        if (product is null)
        {
            throw new KeyNotFoundException("Product not found or does not belong to you.");
        }

        return MapToProductResponse(product);
    }

    public async Task<SellerProductResponse> CreateProductAsync(
     string sellerId, CreateSellerProductRequest request)
    {
        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            IsAvailable = request.StockQuantity > 0,
            CategoryId = request.CategoryId,
            SellerId = sellerId
        };

        var created = await _sellerRepo.CreateProductAsync(product);

        // ── Main Image ────────────────────────────────────────────────────────
        if (request.MainImage != null && request.MainImage.Length > 0)
        {
            var mainUrl = await SaveImageFileAsync(request.MainImage);
            await _sellerRepo.AddProductImageAsync(new ProductImage
            {
                ProductId = created.Id,
                ImageUrl = mainUrl,
                IsMain = true
            });
        }

        // ── Extra Images ──────────────────────────────────────────────────────
        if (request.ExtraImages != null && request.ExtraImages.Count > 0)
        {
            foreach (var file in request.ExtraImages)
            {
                if (file == null || file.Length == 0) continue;

                var extraUrl = await SaveImageFileAsync(file);
                await _sellerRepo.AddProductImageAsync(new ProductImage
                {
                    ProductId = created.Id,
                    ImageUrl = extraUrl,
                    IsMain = false          // ← مهم: مش رئيسية
                });
            }
        }

        var full = await _sellerRepo.GetSellerProductByIdAsync(created.Id, sellerId);
        return MapToProductResponse(full!);
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private async Task<string> SaveImageFileAsync(IFormFile file)
    {
        var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
        var uploadsFolder = Path.Combine(_env.WebRootPath, "images", "products");

        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var filePath = Path.Combine(uploadsFolder, fileName);
        using var fs = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(fs);

        return $"/images/products/{fileName}";
    }
    public async Task<SellerProductResponse> UpdateProductAsync(
        int productId, string sellerId, UpdateSellerProductRequest request)
    {
        var product = await _sellerRepo.GetSellerProductByIdAsync(productId, sellerId)
            ?? throw new KeyNotFoundException("Product not found or does not belong to you.");

        product.Name          = request.Name;
        product.Description   = request.Description;
        product.Price         = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.IsAvailable   = request.StockQuantity > 0;
        product.CategoryId    = request.CategoryId;

        await _sellerRepo.UpdateProductAsync(product);
        return MapToProductResponse(product);
    }

    public async Task DeleteProductAsync(int productId, string sellerId)
    {
        var product = await _sellerRepo.GetSellerProductByIdAsync(productId, sellerId)
            ?? throw new KeyNotFoundException("Product not found or does not belong to you.");

        await _sellerRepo.DeleteProductAsync(product);
    }

    public async Task<SellerProductResponse> UpdateStockAsync(
        int productId, string sellerId, UpdateStockRequest request)
    {
        var product = await _sellerRepo.GetSellerProductByIdAsync(productId, sellerId)
            ?? throw new KeyNotFoundException("Product not found or does not belong to you.");

        product.StockQuantity = request.StockQuantity;
        product.IsAvailable   = request.StockQuantity > 0;
        await _sellerRepo.UpdateProductAsync(product);
        return MapToProductResponse(product);
    }

    // ── Product Images ────────────────────────────────────────────────────────

    public async Task<ProductImageResponse> AddProductImageAsync(
        int productId, string sellerId, AddProductImageRequest request)
    {
        var product = await _sellerRepo.GetSellerProductByIdAsync(productId, sellerId)
            ?? throw new KeyNotFoundException("Product not found or does not belong to you.");

        if (request.IsMain)
            await _sellerRepo.ClearMainImageFlagAsync(productId);

        var imageUrl = await _fileStorage.UploadAsync(request.Image);

        var image = await _sellerRepo.AddProductImageAsync(new ProductImage
        {
            ProductId = productId,
            ImageUrl  = imageUrl,
            IsMain    = request.IsMain
        });

        return new ProductImageResponse
        {
            Id       = image.Id,
            ImageUrl = image.ImageUrl,
            IsMain   = image.IsMain
        };
    }

    public async Task DeleteProductImageAsync(int productId, string sellerId, int imageId)
    {
        _ = await _sellerRepo.GetSellerProductByIdAsync(productId, sellerId)
            ?? throw new KeyNotFoundException("Product not found or does not belong to you.");

        var image = await _sellerRepo.GetProductImageAsync(imageId, productId)
            ?? throw new KeyNotFoundException("Image not found.");

        await _fileStorage.DeleteAsync(image.ImageUrl);
        await _sellerRepo.DeleteProductImageAsync(image);
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    public async Task<List<SellerOrderResponse>> GetOrdersAsync(
        string sellerId, string? status = null)
    {
        var items = await _sellerRepo.GetSellerOrdersAsync(sellerId, status);
        return items.Select(o => MapToOrderResponse(o, sellerId)).ToList();
    }

    public async Task<SellerOrderResponse> GetOrderByIdAsync(int orderId, string sellerId)
    {
        var order = await _sellerRepo.GetSellerOrderByIdAsync(orderId, sellerId)
            ?? throw new KeyNotFoundException("Order not found.");

        return MapToOrderResponse(order, sellerId);
    }

    public async Task<SellerOrderResponse> UpdateOrderStatusAsync(
    int orderId, string sellerId, UpdateOrderStatusRequest request)
    {
        var order = await _sellerRepo.GetSellerOrderByIdAsync(orderId, sellerId)
            ?? throw new KeyNotFoundException("Order not found.");

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
            throw new ArgumentException($"Invalid status: {request.Status}");

        order.Status = newStatus;
        await _sellerRepo.UpdateOrderAsync(order);

        string? notificationWarning = null;
        var userEmail = order.User?.Email;

        if (string.IsNullOrWhiteSpace(userEmail))
        {
            notificationWarning = "Order status updated, but customer email is missing.";
            _logger.LogWarning("Order {OrderId} status changed to {Status}, but customer email is missing.", orderId, newStatus);
        }
        else
        {
            string subject = $"Update for Order #{orderId}";
            string body = GetEmailBodyForStatus(newStatus, orderId);
            const int maxAttempts = 2;
            var smtpSent = false;

            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    await _emailSender.SendAsync(userEmail, subject, body);
                    _logger.LogInformation("Order status email sent via SMTP for order {OrderId} to {Email}", orderId, userEmail);
                    smtpSent = true;
                    notificationWarning = null;
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Failed to send order status email via SMTP for order {OrderId} to {Email}. Attempt {Attempt}/{MaxAttempts}.",
                        orderId, userEmail, attempt, maxAttempts);
                }
            }

            if (!smtpSent)
            {
                for (var attempt = 1; attempt <= maxAttempts; attempt++)
                {
                    try
                    {
                        await _emailService.SendEmailAsync(userEmail, subject, body);
                        _logger.LogInformation("Order status email accepted by SendGrid for order {OrderId} to {Email}", orderId, userEmail);
                        notificationWarning = "Order status updated. Notification was accepted by SendGrid but may be delayed in delivery.";
                        break;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "Failed to send order status email via SendGrid for order {OrderId} to {Email}. Attempt {Attempt}/{MaxAttempts}.",
                            orderId, userEmail, attempt, maxAttempts);

                        if (attempt == maxAttempts)
                        {
                            notificationWarning = "Order status updated, but notification email could not be sent (SMTP and SendGrid failed).";
                        }
                    }
                }
            }
        }

        var response = MapToOrderResponse(order, sellerId);
        response.NotificationWarning = notificationWarning;
        return response;
    }

    private string GetEmailBodyForStatus(OrderStatus status, int orderId)
    {
        return status switch
        {
            OrderStatus.Shipped => $"Great news! Your order #{orderId} has been shipped and is on its way. 🚚",
            OrderStatus.Delivered => $"Order #{orderId} has been delivered. Enjoy your flowers! ✨",
            OrderStatus.Cancelled => $"Your order #{orderId} has been cancelled. Please contact support for details.",
            _ => $"The status of your order #{orderId} has been changed to {status}."
        };
    }

    // ── Earnings ──────────────────────────────────────────────────────────────

    public async Task<EarningsSummaryResponse> GetEarningsSummaryAsync(string sellerId)
    {
        var orders = await _sellerRepo.GetSellerCompletedOrdersAsync(sellerId);

        var now            = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);

        decimal CalcEarnings(IEnumerable<Order> src) =>
            src.Sum(o => o.Items
                .Where(i => i.Product?.SellerId == sellerId)
                .Sum(i => i.Price * i.Quantity));

        var thisMonth = orders.Where(o => o.CreatedAt >= thisMonthStart).ToList();
        var lastMonth = orders.Where(o => o.CreatedAt >= lastMonthStart
                                       && o.CreatedAt < thisMonthStart).ToList();
        var total     = CalcEarnings(orders);

        return new EarningsSummaryResponse
        {
            TotalEarnings     = total,
            ThisMonthEarnings = CalcEarnings(thisMonth),
            LastMonthEarnings = CalcEarnings(lastMonth),
            TotalOrders       = orders.Count,
            ThisMonthOrders   = thisMonth.Count,
            AverageOrderValue = orders.Count > 0 ? total / orders.Count : 0
        };
    }

    public async Task<List<EarningsDetailResponse>> GetEarningsDetailAsync(string sellerId)
    {
        var orders = await _sellerRepo.GetSellerCompletedOrdersAsync(sellerId);

        return orders.Select(o => new EarningsDetailResponse
        {
            OrderId     = o.Id,
            Amount      = o.Items
                            .Where(i => i.Product?.SellerId == sellerId)
                            .Sum(i => i.Price * i.Quantity),
            Date        = o.CreatedAt,
            OrderStatus = o.Status.ToString()
        }).ToList();
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static SellerProfileResponse MapToProfileResponse(ApplicationUser u) => new()
    {
        Id               = u.Id,
        FullName         = u.FullName,
        Email            = u.Email ?? string.Empty,
        PhoneNumber      = u.PhoneNumber,
        Address          = u.Address,
        StoreName        = u.StoreName,
        StoreDescription = u.StoreDescription,
        SellerStatus     = u.SellerStatus,
        WalletBalance    = u.WalletBalance,
        CreatedAt        = u.CreatedAt
    };

    private static SellerProductResponse MapToProductResponse(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name ?? string.Empty,
        Description = p.Description,
        Price = p.Price,
        StockQuantity = p.StockQuantity,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? string.Empty,

        // أكثر أماناً ضد Null
        MainImageUrl = p.Images?
        .FirstOrDefault(i => i != null && i.IsMain)?.ImageUrl
        ?? p.Images?.FirstOrDefault(i => i != null)?.ImageUrl
        ?? null,

        Images = p.Images?
        .Where(i => i != null)
        .Select(i => new ProductImageResponse
        {
            Id = i.Id,
            ImageUrl = i.ImageUrl ?? string.Empty,
            IsMain = i.IsMain
        }).ToList() ?? new List<ProductImageResponse>(),

        // أكثر أماناً لـ Reviews
        AverageRating = (p.Reviews?.Any() == true)
        ? p.Reviews.Average(r => r.Rating)
        : 0.0,

        ReviewCount = p.Reviews?.Count ?? 0
    };
    private static SellerOrderResponse MapToOrderResponse(Order o, string sellerId) => new()
    {
        Id            = o.Id,
        CustomerName  = o.User?.FullName ?? string.Empty,
        CustomerEmail = o.User?.Email ?? string.Empty,
        TotalAmount   = o.TotalAmount,
        Status        = o.Status.ToString(),
        CreatedAt     = o.CreatedAt,
        Items         = o.Items
            .Where(i => i.Product?.SellerId == sellerId)
            .Select(i => new SellerOrderItemResponse
            {
                Id              = i.Id,
                ProductId       = i.ProductId,
                ProductName     = i.Product?.Name ?? string.Empty,
                ProductImageUrl = i.Product?.Images.FirstOrDefault(img => img.IsMain)?.ImageUrl,
                Quantity        = i.Quantity,
                Price           = i.Price
            }).ToList(),
        Payment = o.Payment == null ? null : new PaymentSummaryResponse
        {
            Method = o.Payment.PaymentMethod.ToString(),
            Status = o.Payment.Status.ToString(),
            PaidAt = o.Payment.PaidAt
        }
    };
}