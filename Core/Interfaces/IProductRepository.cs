using Core.Entities;

namespace Core.Interfaces;

public interface IProductRepository
{
   
    Task<(IEnumerable<Product> Products, int TotalCount)> GetProductsAsync(
        string? searchTerm,
        int? categoryId,
        int pageNumber,
        int pageSize);

    Task<Product?> GetProductByIdAsync(int id);
    Task AddProductAsync(Product product);
    void UpdateProductAsync(Product product);
    void DeleteProductAsync(Product product);
    Task<bool> SaveChangesAsync();
}