using Core.DTOs.Order;
using Core.Interfaces;
using Infrastructure.Persistence;
using System.CodeDom;
using Microsoft.EntityFrameworkCore;

namespace API.Services
{
    public class OrderHistoryService : IOrderHistoryService
    {
        private readonly AppDbContext _context;
        public OrderHistoryService(AppDbContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<OrderHistoryDto>> GetUserOrdersAsync(string userId)
        {
            return await _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new OrderHistoryDto
                {
                    Id = o.Id,
                    CreatedAt = o.CreatedAt,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(), 
                    ItemCount = o.Items.Count
                })
                .ToListAsync();
        }
    }
}

