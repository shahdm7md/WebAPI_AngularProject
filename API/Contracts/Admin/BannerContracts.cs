namespace API.Contracts.Admin
{
    public sealed class BannerResponse
    {
        public int Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string ImageUrl { get; init; } = string.Empty;
        public string? Link { get; init; }
        public bool IsActive { get; init; }
        public int DisplayOrder { get; init; }
    }

    public sealed class CreateBannerRequest
    {
        public string Title { get; init; } = string.Empty;
        public string? Link { get; init; }
        public int DisplayOrder { get; init; } = 0;
    }

    public sealed class UpdateBannerRequest
    {
        public string Title { get; init; } = string.Empty;
        public string? Link { get; init; }
        public bool IsActive { get; init; }
        public int DisplayOrder { get; init; }
    }

    public sealed class BannerResult
    {
        public bool Success { get; init; }
        public int StatusCode { get; init; }
        public string Message { get; init; } = string.Empty;
        public BannerResponse? Banner { get; init; }
    }
}
