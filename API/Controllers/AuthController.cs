using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using API.Contracts.Auth;
using API.Services;
using API.Settings;
using Core.Entities;
using Google.Apis.Auth;
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
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly JwtOptions _jwtOptions;
    private readonly GoogleAuthOptions _googleAuthOptions;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IOptions<JwtOptions> jwtOptions,
        IOptions<GoogleAuthOptions> googleAuthOptions,
        IEmailSender emailSender,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _jwtOptions = jwtOptions.Value;
        _googleAuthOptions = googleAuthOptions.Value;
        _emailSender = emailSender;
        _logger = logger;
    }

    [HttpPost("register/customer")]
    public async Task<IActionResult> RegisterCustomer(RegisterCustomerRequest request)
    {
        await EnsureRolesExistAsync();

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

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Customer registration failed.", errors = result.Errors.Select(e => e.Description) });
        }

        var roleResult = await _userManager.AddToRoleAsync(user, "Customer");
        if (!roleResult.Succeeded)
        {
            return BadRequest(new { message = "User created but assigning the Customer role failed.", errors = roleResult.Errors.Select(e => e.Description) });
        }

        await SendOtpAsync(user, "Complete your customer registration");

        return Ok("Customer registration successful. Please verify your email with the OTP code sent to your inbox.");
    }

    [HttpPost("register/seller")]
    public async Task<IActionResult> RegisterSeller(RegisterSellerRequest request)
    {
        await EnsureRolesExistAsync();

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
            IsActive = false,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Seller registration failed.", errors = result.Errors.Select(e => e.Description) });
        }

        var roleResult = await _userManager.AddToRoleAsync(user, "Seller");
        if (!roleResult.Succeeded)
        {
            return BadRequest(new { message = "User created but assigning the Seller role failed.", errors = roleResult.Errors.Select(e => e.Description) });
        }

        await SendOtpAsync(user, "Complete your seller registration");

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
        if (user is null)
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

        var userRoles = await _userManager.GetRolesAsync(user);
        var isSeller = userRoles.Contains("Seller");

        if (isSeller && !user.IsActive)
        {
            return Unauthorized("Your account is pending admin approval");
        }

        if (!isSeller && !user.IsActive)
        {
            return Unauthorized("Your account is inactive. Please contact support.");
        }

        var token = await GenerateJwtTokenAsync(user, userRoles);
        return Ok(token);
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin(GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            return BadRequest(new { message = "Google ID token is required." });
        }

        if (string.IsNullOrWhiteSpace(_googleAuthOptions.ClientId))
        {
            _logger.LogError("Google ClientId is missing from configuration.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Google authentication is not configured." });
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                request.IdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [_googleAuthOptions.ClientId]
                });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new { message = "Invalid Google token." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while validating Google token.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Google authentication failed." });
        }

        if (string.IsNullOrWhiteSpace(payload.Email))
        {
            return BadRequest(new { message = "Google token does not contain an email address." });
        }

        await EnsureRolesExistAsync();

        var user = await _userManager.FindByEmailAsync(payload.Email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = payload.Email,
                Email = payload.Email,
                FullName = string.IsNullOrWhiteSpace(payload.Name) ? payload.Email.Split('@')[0] : payload.Name,
                IsActive = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Google login failed while creating user account.",
                    errors = createResult.Errors.Select(e => e.Description)
                });
            }

            var addToCustomerRoleResult = await _userManager.AddToRoleAsync(user, "Customer");
            if (!addToCustomerRoleResult.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Google login failed while assigning Customer role.",
                    errors = addToCustomerRoleResult.Errors.Select(e => e.Description)
                });
            }
        }

        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            await _userManager.UpdateAsync(user);
        }

        var userRoles = await _userManager.GetRolesAsync(user);
        if (userRoles.Count == 0)
        {
            var addToCustomerRoleResult = await _userManager.AddToRoleAsync(user, "Customer");
            if (!addToCustomerRoleResult.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Google login failed while assigning Customer role.",
                    errors = addToCustomerRoleResult.Errors.Select(e => e.Description)
                });
            }

            userRoles = await _userManager.GetRolesAsync(user);
        }

        var isSeller = userRoles.Contains("Seller");
        if (isSeller && !user.IsActive)
        {
            return Unauthorized(new { message = "Your account is pending admin approval" });
        }

        if (!isSeller && !user.IsActive)
        {
            return Unauthorized(new { message = "Your account is inactive. Please contact support." });
        }

        var token = await GenerateJwtTokenAsync(user, userRoles);
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

    private static readonly string[] RequiredRoles = ["Admin", "Seller", "Customer"];

    private async Task EnsureRolesExistAsync()
    {
        foreach (var roleName in RequiredRoles)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                var createRoleResult = await _roleManager.CreateAsync(new IdentityRole(roleName));
                if (!createRoleResult.Succeeded)
                {
                    var errors = string.Join(", ", createRoleResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Failed to ensure role '{roleName}' exists: {errors}");
                }
            }
        }
    }

    private Task<AuthResponse> GenerateJwtTokenAsync(ApplicationUser user, IList<string> userRoles)
    {
        var primaryRole = userRoles.FirstOrDefault() ?? string.Empty;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new("userId", user.Id),
            new("email", user.Email ?? string.Empty),
            new("role", primaryRole),
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

        var authResponse = new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(jwtToken),
            ExpiresAtUtc = expiresAt,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName
        };

        return Task.FromResult(authResponse);
    }
}