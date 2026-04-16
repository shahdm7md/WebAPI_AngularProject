namespace API.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _rootPath;
        private readonly string _baseUrl;

        public LocalFileStorageService(string rootPath, string baseUrl)
        {
            _rootPath = rootPath;
            _baseUrl = baseUrl;
        }

        public async Task<string> UploadAsync(IFormFile file)
        {
            var folder = Path.Combine(_rootPath, "products");
            Directory.CreateDirectory(folder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(folder, fileName);

            await using var stream = File.Create(filePath);
            await file.CopyToAsync(stream);

            return $"{_baseUrl}/products/{fileName}";
        }

        public Task DeleteAsync(string fileUrl)
        {
            var fileName = Path.GetFileName(new Uri(fileUrl).LocalPath);
            var filePath = Path.Combine(_rootPath, "products", fileName);
            if (File.Exists(filePath)) File.Delete(filePath);
            return Task.CompletedTask;
        }
    }
}
