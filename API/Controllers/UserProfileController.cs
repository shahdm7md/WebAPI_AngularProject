using API.Contracts.Profile;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public sealed class UserProfileController : ControllerBase
{
    private readonly IUserProfileService _profileService;

    public UserProfileController(IUserProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var profile = await _profileService.GetUserProfileAsync(userId);
        if (profile is null) return NotFound("User not found.");

        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var result = await _profileService.UpdateProfileAsync(userId, request);

        return result.Success
            ? Ok(new { result.Message, result.Profile })
            : StatusCode(result.StatusCode, result.Message);
    }

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var result = await _profileService.ChangePasswordAsync(userId, request);

        return result.Success
            ? Ok(result.Message)
            : StatusCode(result.StatusCode, result.Message);
    }
}
