using Core.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Core.Interfaces
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<Category>> GetAllAsync();


        Task AddAsync(Category category);
        Task<bool> SaveChangesAsync();
    }
}
