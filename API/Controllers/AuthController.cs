using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using API.Contracts.Auth;
using API.Services;
using API.Settings;
using Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtOptions _jwtOptions;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        IOptions<JwtOptions> jwtOptions,
        IEmailSender emailSender,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _jwtOptions = jwtOptions.Value;
        _emailSender = emailSender;
        _logger = logger;
    }

    [HttpPost("register/customer")]
    public async Task<IActionResult> RegisterCustomer(RegisterCustomerRequest request)
    {
        if (request.Password != request.ConfirmPassword)
        {
            return BadRequest("Password and Confirm Password do not match.");
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return BadRequest("Email is already registered.");
        }

        var fullName = request.Email.Split('@')[0];

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = fullName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        //var result = await _userManager.CreateAsync(user, request.Password);
        //if (!result.Succeeded)
        //{
        //    return BadRequest(result.Errors.Select(error => error.Description));
        //}

        //await _userManager.AddToRoleAsync(user, "Customer");
        //await SendOtpAsync(user, "Complete your customer registration");
        // RegisterCustomer
        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));

        await SendOtpAsync(user, "Complete your customer registration"); // ← الأول
        await _userManager.AddToRoleAsync(user, "Customer");             // ← التاني

        return Ok("Customer registration successful. Please verify your email with the OTP code sent to your inbox.");
    }

    [HttpPost("register/seller")]
    public async Task<IActionResult> RegisterSeller(RegisterSellerRequest request)
    {
        if (request.Password != request.ConfirmPassword)
        {
            return BadRequest("Password and Confirm Password do not match.");
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return BadRequest("Email is already registered.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.StoreName,
            StoreName = request.StoreName,
            StoreDescription = request.StoreDescription,
            SellerStatus = "Pending",
            WalletBalance = 0m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        //var result = await _userManager.CreateAsync(user, request.Password);
        //if (!result.Succeeded)
        //{
        //    return BadRequest(result.Errors.Select(error => error.Description));
        //}

        //await _userManager.AddToRoleAsync(user, "Seller");
        //await SendOtpAsync(user, "Complete your seller registration");

        // RegisterSeller
        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));

        await SendOtpAsync(user, "Complete your seller registration"); // ← الأول
        await _userManager.AddToRoleAsync(user, "Seller");             // ← التاني
        return Ok("Seller registration successful. Please verify your email with the OTP code sent to your inbox.");
    }

    [HttpPost("verify-email-otp")]
    public async Task<IActionResult> VerifyEmailOtp(VerifyEmailOtpRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return BadRequest("Account not found.");
        }

        if (string.IsNullOrWhiteSpace(user.OtpCode) || user.OtpExpiry is null)
        {
            return BadRequest("No OTP is available. Please request a new code.");
        }

        if (user.OtpExpiry < DateTime.UtcNow)
        {
            return BadRequest("OTP has expired. Please request a new code.");
        }

        if (!string.Equals(user.OtpCode, request.OtpCode, StringComparison.Ordinal))
        {
            return BadRequest("Invalid OTP code.");
        }

        user.EmailConfirmed = true;
        user.OtpCode = null;
        user.OtpExpiry = null;

        await _userManager.UpdateAsync(user);

        return Ok("Email verified successfully.");
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp(ResendOtpRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return BadRequest("Account not found.");
        }

        await SendOtpAsync(user, "Your verification OTP code");
        return Ok("A new OTP code has been sent to your email.");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            return Unauthorized("Invalid credentials.");
        }

        var isValidPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValidPassword)
        {
            return Unauthorized("Invalid credentials.");
        }

        if (!user.EmailConfirmed)
        {
            await SendOtpAsync(user, "Verify your email before login");
            return Unauthorized("Email is not verified. A fresh OTP code has been sent to your email.");
        }

        var token = await GenerateJwtTokenAsync(user);
        return Ok(token);
    }

    private async Task SendOtpAsync(ApplicationUser user, string subject)
    {
        var otp = Random.Shared.Next(100000, 999999).ToString();

        user.OtpCode = otp;
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);

        await _userManager.UpdateAsync(user);

        try
        {
            var body = $"<p>Your OTP code is <strong>{otp}</strong>.</p><p>This code expires in 10 minutes.</p>";
            await _emailSender.SendAsync(user.Email ?? string.Empty, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send OTP email to {Email}", user.Email);
        }
    }

    private async Task<AuthResponse> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var userRoles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.AddRange(userRoles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpiryMinutes);

        var jwtToken = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(jwtToken),
            ExpiresAtUtc = expiresAt,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName
        };
    }
}