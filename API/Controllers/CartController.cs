using Core.DTOs.Cart;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // GET api/cart
    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        var cart = await _cartService.GetCartAsync(GetUserId());
        return Ok(cart);
    }

    // POST api/cart/items
    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] CartItemRequestDto dto)
    {
        var cart = await _cartService.AddItemAsync(GetUserId(), dto);
        return Ok(cart);
    }

    // PUT api/cart/items/{productId}
    [HttpPut("items/{productId:int}")]
    public async Task<IActionResult> UpdateItem(int productId, [FromQuery] int quantity)
    {
        var cart = await _cartService.UpdateItemAsync(GetUserId(), productId, quantity);
        return Ok(cart);
    }

    // DELETE api/cart/items/{productId}
    [HttpDelete("items/{productId:int}")]
    public async Task<IActionResult> RemoveItem(int productId)
    {
        await _cartService.RemoveItemAsync(GetUserId(), productId);
        return NoContent();
    }

    // DELETE api/cart
    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        await _cartService.ClearCartAsync(GetUserId());
        return NoContent();
    }
}