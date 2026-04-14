using SharedKernel.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Core.DTOs.Order
{
    public class OrderResponseDto
    {
        public int Id { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderItemResponseDto> Items { get; set; } = new();
        public PaymentResponseDto? Payment { get; set; }
    }
}
