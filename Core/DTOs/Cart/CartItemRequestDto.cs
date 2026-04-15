using System;
using System.Collections.Generic;
using System.Text;

namespace Core.DTOs.Cart
{
    public class CartItemRequestDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
