using API.Contracts.Categories;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _categoryRepo;

    public CategoriesController(ICategoryRepository categoryRepo)
    {
        _categoryRepo = categoryRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _categoryRepo.GetAllAsync();
        var response = categories.Select(c => new CategoryResponse(c.Id, c.Name));
        return Ok(response);
    }

    [HttpPost]
     //[Authorize(Roles = "Admin")] 
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Category name is required.");

        var category = new Category { Name = request.Name };

        await _categoryRepo.AddAsync(category);
        await _categoryRepo.SaveChangesAsync();

        return Ok(new { Message = "Category created successfully!", Id = category.Id });
    }
}