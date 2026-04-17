using API.Contracts.Products;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _productRepo;
        private readonly IWebHostEnvironment _env;
        private readonly AppDbContext _context;
        //public ProductsController(IProductRepository productRepo)
        //{
        //    _productRepo = productRepo;
        //}
        public ProductsController(IProductRepository productRepo, IWebHostEnvironment env, AppDbContext context)
        {
            _productRepo = productRepo;
            _env = env;
            _context = context;
        }


        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? categoryId, int page = 1, int size = 10)
        {
            var (products, total) = await _productRepo.GetProductsAsync(search, categoryId, page, size);

            var response = products.Select(p => new ProductResponse(
                p.Id, p.Name, p.Description, p.Price, p.StockQuantity,
                p.Category?.Name ?? "", p.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl,
                p.IsActive,
                p.IsActive && p.StockQuantity > 0,
                p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0,
                p.Reviews.Count));

            return Ok(new { Data = response, TotalCount = total });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var p = await _productRepo.GetProductByIdAsync(id);
            if (p == null) return NotFound();
            return Ok(new ProductResponse(
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.StockQuantity,
                p.Category?.Name ?? "",
                p.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl,
                p.IsActive,
                p.IsActive && p.StockQuantity > 0,
                p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0,
                p.Reviews.Count));
        }

        [HttpGet("{id:int}/details")]
        public async Task<IActionResult> GetDetails(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Include(p => p.Reviews)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }

            var reviews = product.Reviews
                .OrderByDescending(r => r.CreatedAt)
                .Take(12)
                .Select(r => new ProductReviewDto(
                    r.Id,
                    r.User?.FullName?.Trim().Length > 0 ? r.User!.FullName! : r.User?.Email ?? "Customer",
                    r.Rating,
                    r.Comment,
                    r.CreatedAt))
                .ToList();

            var images = product.Images
                .OrderByDescending(image => image.IsMain)
                .Select(image => new ProductImageDto(image.Id, image.ImageUrl, image.IsMain))
                .ToList();

            return Ok(new ProductDetailResponse(
                product.Id,
                product.Name,
                product.Description,
                product.Price,
                product.StockQuantity,
                product.Category?.Name ?? string.Empty,
                product.Images.FirstOrDefault(image => image.IsMain)?.ImageUrl,
                product.IsActive,
                product.IsActive && product.StockQuantity > 0,
                product.Reviews.Any() ? Math.Round(product.Reviews.Average(r => r.Rating), 1) : 0,
                product.Reviews.Count,
                images,
                reviews));
        }

        [HttpGet("{id:int}/purchase-status")]
        [Authorize]
        public async Task<IActionResult> GetPurchaseStatus(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("userId");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var hasPurchased = await _context.Orders
                .Include(order => order.Items)
                .Include(order => order.Payment)
                .AnyAsync(order =>
                    order.UserId == userId &&
                    order.Payment != null &&
                    order.Payment.Status == SharedKernel.Enums.PaymentStatus.Completed &&
                    order.Items.Any(item => item.ProductId == id));

            return Ok(new PurchaseStatusResponse { HasPurchased = hasPurchased });
        }

        [HttpPost("{id:int}/reviews")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> AddReview(int id, [FromBody] CreateProductReviewRequest request)
        {
            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest("Rating must be between 1 and 5.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("userId");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var hasPurchased = await _context.Orders
                .Include(order => order.Items)
                .Include(order => order.Payment)
                .AnyAsync(order =>
                    order.UserId == userId &&
                    order.Payment != null &&
                    order.Payment.Status == SharedKernel.Enums.PaymentStatus.Completed &&
                    order.Items.Any(item => item.ProductId == id));

            if (!hasPurchased)
            {
                return Forbid();
            }

            var alreadyReviewed = await _context.Reviews
                .AnyAsync(review => review.ProductId == id && review.UserId == userId);

            if (alreadyReviewed)
            {
                return BadRequest("You already reviewed this product.");
            }

            var productExists = await _context.Products.AnyAsync(product => product.Id == id);
            if (!productExists)
            {
                return NotFound();
            }

            var review = new Review
            {
                ProductId = id,
                UserId = userId,
                Rating = request.Rating,
                Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                review.Id,
                review.Rating,
                review.Comment,
                review.CreatedAt
            });
        }

        [HttpGet("{id:int}/reviews")]
        public async Task<IActionResult> GetReviews(int id)
        {
            var reviews = await _context.Reviews
                .Include(review => review.User)
                .Where(review => review.ProductId == id)
                .OrderByDescending(review => review.CreatedAt)
                .Select(review => new ProductReviewDto(
                    review.Id,
                    review.User != null && review.User.FullName.Trim().Length > 0
                        ? review.User.FullName
                        : review.User != null
                            ? review.User.Email ?? "Customer"
                            : "Customer",
                    review.Rating,
                    review.Comment,
                    review.CreatedAt))
                .ToListAsync();

            return Ok(reviews);
        }
        [HttpPost]
        [Consumes("multipart/form-data")]
    [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> CreateProduct([FromForm] CreateProductRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

        var sellerId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("userId");

        if (string.IsNullOrWhiteSpace(sellerId))
        {
            return Unauthorized("Unable to determine the current user.");
        }

       
            var product = new Product
            {
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                StockQuantity = request.StockQuantity,
                CategoryId = request.CategoryId,
            SellerId = sellerId
            };


            if (request.MainImage != null && request.MainImage.Length > 0)
            {

                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(request.MainImage.FileName);
                var uploadsFolder = Path.Combine(_env.WebRootPath, "images", "products");


                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var filePath = Path.Combine(uploadsFolder, fileName);


                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await request.MainImage.CopyToAsync(fileStream);
                }


                product.Images.Add(new ProductImage
                {
                    ImageUrl = $"/images/products/{fileName}",
                    IsMain = true
                });
            }


            await _productRepo.AddProductAsync(product);
            await _productRepo.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = product.Id }, new { Message = "Product created successfully!" });
        }


        [HttpPut("{id}")]
    [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] CreateProductRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);


            var existingProduct = await _productRepo.GetProductByIdAsync(id);
            if (existingProduct == null) return NotFound($"Product with ID {id} not found.");


            existingProduct.Name = request.Name;
            existingProduct.Description = request.Description;
            existingProduct.Price = request.Price;
            existingProduct.StockQuantity = request.StockQuantity;
            existingProduct.CategoryId = request.CategoryId;


            _productRepo.UpdateProductAsync(existingProduct);
            await _productRepo.SaveChangesAsync();

            return Ok(new { Message = "Product updated successfully!" });
        }


        [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> DeleteProduct(int id)
        {

            var product = await _productRepo.GetProductByIdAsync(id);
            if (product == null) return NotFound($"Product with ID {id} not found.");


            if (product.Images != null && product.Images.Any())
            {
                var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                foreach (var image in product.Images)
                {
                    var fileName = Path.GetFileName(image.ImageUrl);
                    var filePath = Path.Combine(webRootPath, "images", "products", fileName);

                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }
            }


            _productRepo.DeleteProductAsync(product);
            await _productRepo.SaveChangesAsync();

            return Ok(new { Message = "Product deleted successfully!" });
        }
    }
}
