namespace API.Contracts.Auth;

public class RegisterSellerRequest
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;

    public string StoreName { get; set; } = string.Empty;

    public string StoreDescription { get; set; } = string.Empty;
}
