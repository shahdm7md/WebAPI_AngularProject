using API.Contracts.Products;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _productRepo;
    private readonly IWebHostEnvironment _env;
public ProductsController(IProductRepository productRepo, IWebHostEnvironment env)
{
    _productRepo = productRepo;
    _env = env;
}


    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? categoryId, int page = 1, int size = 10)
    {
        var (products, total) = await _productRepo.GetProductsAsync(search, categoryId, page, size);

        var response = products.Select(p => new ProductResponse(
            p.Id, p.Name, p.Description, p.Price, p.StockQuantity,
            p.Category?.Name ?? "", p.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl));

        return Ok(new { Data = response, TotalCount = total });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var p = await _productRepo.GetProductByIdAsync(id);
        if (p == null) return NotFound();
        return Ok(new ProductResponse(p.Id, p.Name, p.Description, p.Price, p.StockQuantity, p.Category?.Name ?? "", p.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl));
    }
    [HttpPost]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> CreateProduct([FromForm] CreateProductRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var sellerId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("userId");

        if (string.IsNullOrWhiteSpace(sellerId))
        {
            return Unauthorized("Unable to determine the current user.");
        }

       
        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            CategoryId = request.CategoryId,
            SellerId = sellerId
        };

       
        if (request.MainImage != null && request.MainImage.Length > 0)
        {
        
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(request.MainImage.FileName);
            var uploadsFolder = Path.Combine(_env.WebRootPath, "images", "products");

            
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var filePath = Path.Combine(uploadsFolder, fileName);

           
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await request.MainImage.CopyToAsync(fileStream);
            }

           
            product.Images.Add(new ProductImage
            {
                ImageUrl = $"/images/products/{fileName}",
                IsMain = true
            });
        }

       
        await _productRepo.AddProductAsync(product);
        await _productRepo.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = product.Id }, new { Message = "Product created successfully!" });
    }


    [HttpPut("{id}")]
    [Authorize(Roles = "Seller,Admin")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] CreateProductRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

      
        var existingProduct = await _productRepo.GetProductByIdAsync(id);
        if (existingProduct == null) return NotFound($"Product with ID {id} not found.");

       
        existingProduct.Name = request.Name;
        existingProduct.Description = request.Description;
        existingProduct.Price = request.Price;
        existingProduct.StockQuantity = request.StockQuantity;
        existingProduct.CategoryId = request.CategoryId;

     
        _productRepo.UpdateProductAsync(existingProduct);
        await _productRepo.SaveChangesAsync();

        return Ok(new { Message = "Product updated successfully!" });
    }


    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Seller")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
       
        var product = await _productRepo.GetProductByIdAsync(id);
        if (product == null) return NotFound($"Product with ID {id} not found.");

      
        if (product.Images != null && product.Images.Any())
        {
            var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            foreach (var image in product.Images)
            {
                var fileName = Path.GetFileName(image.ImageUrl);
                var filePath = Path.Combine(webRootPath, "images", "products", fileName);

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }
        }

  
        _productRepo.DeleteProductAsync(product);
        await _productRepo.SaveChangesAsync();

        return Ok(new { Message = "Product deleted successfully!" });
    }
}