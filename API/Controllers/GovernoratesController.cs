using Core.DTOs;
using Core.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/governorates")]
public class GovernoratesController : ControllerBase
{
    private readonly AppDbContext _context;

    public GovernoratesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GovernorateDto>>> GetGovernorates()
    {
        var governorates = await _context.Governorates
            .Where(g => g.IsActive)
            .OrderBy(g => g.Name)
            .Select(g => new GovernorateDto
            {
                Id = g.Id,
                Name = g.Name,
                NameAr = g.NameAr,
                ShippingCost = g.ShippingCost,
                IsActive = g.IsActive
            })
            .ToListAsync();

        return Ok(governorates);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GovernorateDto>> GetGovernorate(int id)
    {
        var governorate = await _context.Governorates.FindAsync(id);
        if (governorate == null || !governorate.IsActive)
            return NotFound();

        return Ok(new GovernorateDto
        {
            Id = governorate.Id,
            Name = governorate.Name,
            NameAr = governorate.NameAr,
            ShippingCost = governorate.ShippingCost,
            IsActive = governorate.IsActive
        });
    }
}
