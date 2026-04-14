using Core.DTOs.Order;
using System;
using System.Collections.Generic;
using System.Text;

namespace Core.Interfaces
{
    public interface ICheckoutService
    {
        Task<OrderResponseDto> CheckoutAsync(string userId, CheckoutRequestDto dto);
        Task<OrderResponseDto> GetOrderSummaryAsync(string userId);
    }
}
