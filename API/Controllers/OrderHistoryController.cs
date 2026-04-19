using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Stripe.Climate;
using System.Security.Claims;

namespace API.Controllers
{
    [Route("api/orders")]
    [ApiController]
    public class OrderHistoryController : ControllerBase
    {
        private readonly IOrderHistoryService _orderHistoryService;

        public OrderHistoryController(IOrderHistoryService orderHistoryService)
        {
            _orderHistoryService = orderHistoryService;
        }
        [Authorize]
        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null) return Unauthorized();

            var orders = await _orderHistoryService.GetUserOrdersAsync(userId);
            return Ok(orders);
        }
    }
}
