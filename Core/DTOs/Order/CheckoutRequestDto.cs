using SharedKernel.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Core.DTOs.Order
{
    public class CheckoutRequestDto
    {
        public string ShippingAddress { get; set; } = string.Empty;
        public PaymentMethod PaymentMethod { get; set; }
        public string? CouponCode { get; set; }
    }
}
