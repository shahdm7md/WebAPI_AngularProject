using Core.Entities;

namespace Core.Interfaces;

public interface ICategoryRepository
{
    Task<IEnumerable<Category>> GetAllAsync();


    Task AddAsync(Category category);
    Task<bool> SaveChangesAsync();
}