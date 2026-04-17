using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly AppDbContext _context;

    public WishlistController(AppDbContext context)
    {
        _context = context;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue("userId") ??
        throw new UnauthorizedAccessException("User id not found in token.");

    [HttpGet]
    public async Task<IActionResult> GetMyWishlist()
    {
        var userId = GetUserId();

        var items = await _context.Wishlists
            .Where(w => w.UserId == userId)
            .Include(w => w.Product)
                .ThenInclude(p => p!.Images)
            .Include(w => w.Product)
                .ThenInclude(p => p!.Reviews)
            .Where(w => w.Product != null && w.Product.IsActive)
            .Select(w => new
            {
                w.ProductId,
                w.Product!.Name,
                w.Product.Description,
                w.Product.Price,
                w.Product.StockQuantity,
                MainImageUrl = w.Product.Images.Where(i => i.IsMain).Select(i => i.ImageUrl).FirstOrDefault(),
                AverageRating = w.Product.Reviews.Any() ? Math.Round(w.Product.Reviews.Average(r => r.Rating), 1) : 0,
                ReviewCount = w.Product.Reviews.Count
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("{productId:int}")]
    public async Task<IActionResult> AddToWishlist(int productId)
    {
        var userId = GetUserId();

        var productExists = await _context.Products
            .AnyAsync(p => p.Id == productId && p.IsActive);

        if (!productExists)
        {
            return NotFound("Product not found or inactive.");
        }

        var exists = await _context.Wishlists
            .AnyAsync(w => w.UserId == userId && w.ProductId == productId);

        if (exists)
        {
            return Ok(new { message = "Product is already in wishlist." });
        }

        _context.Wishlists.Add(new Core.Entities.Wishlist
        {
            UserId = userId,
            ProductId = productId
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Added to wishlist." });
    }

    [HttpDelete("{productId:int}")]
    public async Task<IActionResult> RemoveFromWishlist(int productId)
    {
        var userId = GetUserId();

        var item = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

        if (item == null)
        {
            return NotFound("Product not found in wishlist.");
        }

        _context.Wishlists.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("contains/{productId:int}")]
    public async Task<IActionResult> Contains(int productId)
    {
        var userId = GetUserId();
        var exists = await _context.Wishlists.AnyAsync(w => w.UserId == userId && w.ProductId == productId);
        return Ok(new { productId, isInWishlist = exists });
    }
}
