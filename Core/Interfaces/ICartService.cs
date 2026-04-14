using Core.DTOs.Cart;
using System;
using System.Collections.Generic;
using System.Text;

namespace Core.Interfaces
{
    public interface ICartService
    {
        Task<CartResponseDto> GetCartAsync(string userId);
        Task<CartResponseDto> AddItemAsync(string userId, CartItemRequestDto dto);
        Task<CartResponseDto> UpdateItemAsync(string userId, int productId, int quantity);
        Task RemoveItemAsync(string userId, int productId);
        Task ClearCartAsync(string userId);
    }
}
