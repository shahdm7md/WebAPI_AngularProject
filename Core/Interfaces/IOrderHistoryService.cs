using Core.DTOs.Order;
using System;
using System.Collections.Generic;
using System.Text;

namespace Core.Interfaces
{
    public interface IOrderHistoryService
    {
        Task<IEnumerable<OrderHistoryDto>> GetUserOrdersAsync(string userId);
    }
}
