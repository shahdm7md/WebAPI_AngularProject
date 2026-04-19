using API.Contracts.Profile;

namespace API.Services;

public interface IUserProfileService
{
    Task<UserProfileResponse?> GetUserProfileAsync(string userId);
    Task<UpdateProfileResult> UpdateProfileAsync(string userId, UpdateProfileRequest request);
    Task<ChangePasswordResult> ChangePasswordAsync(string userId, ChangePasswordRequest request);
}

public sealed class UpdateProfileResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string Message { get; init; } = string.Empty;
    public UserProfileResponse? Profile { get; init; }
}

public sealed class ChangePasswordResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string Message { get; init; } = string.Empty;
}
