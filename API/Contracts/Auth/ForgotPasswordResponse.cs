namespace API.Contracts.Auth;

public class ForgotPasswordResponse
{
    public string ResetToken { get; set; } = string.Empty;
}
