using System;
using System.Collections.Generic;
using System.Text;

namespace Core.DTOs.Cart
{
    public class CartResponseDto
    {
        public int Id { get; set; }
        public List<CartItemResponseDto> Items { get; set; } = new();
        public decimal TotalPrice => Items.Sum(i => i.SubTotal);
        public int TotalItems => Items.Sum(i => i.Quantity);
    }
}
