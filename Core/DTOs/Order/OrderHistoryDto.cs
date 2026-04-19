using SharedKernel.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Core.DTOs.Order
{
    public class OrderHistoryDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public int ItemCount { get; set; }
    }
}
