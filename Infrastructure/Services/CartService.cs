using Core.Entities;
using Infrastructure.Persistence;
using Core.Interfaces;
using Core.DTOs.Cart;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class CartService : ICartService
    {
        private readonly AppDbContext _context;

        public CartService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CartResponseDto> GetCartAsync(string userId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            return MapToDto(cart);
        }

        public async Task<CartResponseDto> AddItemAsync(string userId, CartItemRequestDto dto)
        {
            var cart = await GetOrCreateCartAsync(userId);

            var product = await _context.Products.FindAsync(dto.ProductId)
                ?? throw new KeyNotFoundException("Product not found.");

            if (product.StockQuantity < dto.Quantity)
                throw new InvalidOperationException("Not enough stock available.");

            var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == dto.ProductId);

            if (existingItem is not null)
            {
                existingItem.Quantity += dto.Quantity;
            }
            else
            {
                cart.Items.Add(new CartItem
                {
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity
                });
            }

            await _context.SaveChangesAsync();
            
            return await GetCartAsync(userId);
        }

        public async Task<CartResponseDto> UpdateItemAsync(string userId, int productId, int quantity)
        {
            var cart = await GetOrCreateCartAsync(userId);

            var item = cart.Items.FirstOrDefault(i => i.ProductId == productId)
                ?? throw new KeyNotFoundException("Item not in cart.");

            if (quantity <= 0)
            {
                _context.CartItems.Remove(item);
            }
            else
            {
                var product = await _context.Products.FindAsync(productId)
                    ?? throw new KeyNotFoundException("Product not found.");

                if (product.StockQuantity < quantity)
                    throw new InvalidOperationException("Not enough stock.");

                item.Quantity = quantity;
            }

            await _context.SaveChangesAsync();
            return await GetCartAsync(userId);
        }

        public async Task RemoveItemAsync(string userId, int productId)
        {
            var cart = await GetOrCreateCartAsync(userId);

            var item = cart.Items.FirstOrDefault(i => i.ProductId == productId)
                ?? throw new KeyNotFoundException("Item not found in cart.");

            _context.CartItems.Remove(item);
            await _context.SaveChangesAsync();
        }

        public async Task ClearCartAsync(string userId)
        {
            var cart = await GetOrCreateCartAsync(userId);
            _context.CartItems.RemoveRange(cart.Items);
            await _context.SaveChangesAsync();
        }


        private async Task<Cart> GetOrCreateCartAsync(string userId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p!.Images)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart is null)
            {
                cart = new Cart { UserId = userId };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            return cart;
        }

        private static CartResponseDto MapToDto(Cart cart)
        {
            return new CartResponseDto
            {
                Id = cart.Id,
                Items = cart.Items.Select(item => new CartItemResponseDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductName = item.Product?.Name ?? string.Empty,
                    ProductImage = item.Product?.Images
                        .FirstOrDefault(img => img.IsMain)?.ImageUrl,
                    UnitPrice = item.Product?.Price ?? 0,
                    Quantity = item.Quantity
                }).ToList()
            };
        }
    }
}
