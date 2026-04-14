using SharedKernel.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Core.DTOs.Order
{
    public class PaymentResponseDto
    {
        public int Id { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public PaymentStatus Status { get; set; }
        public string? TransactionId { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
