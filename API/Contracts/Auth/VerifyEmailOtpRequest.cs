namespace API.Contracts.Auth;

public class VerifyEmailOtpRequest
{
    public string Email { get; set; } = string.Empty;

    public string OtpCode { get; set; } = string.Empty;
}
