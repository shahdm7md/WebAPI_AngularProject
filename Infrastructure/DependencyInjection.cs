using Core.Entities;
using Core.Interfaces;
using Infrastructure.Persistence;
<<<<<<< Updated upstream
=======
using Infrastructure.Repositories;
using Infrastructure.Services;
>>>>>>> Stashed changes
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
<<<<<<< Updated upstream
=======
//using Infrastructure.Repositories; 
>>>>>>> Stashed changes

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequiredLength = 8;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.User.RequireUniqueEmail = true;
        })
        .AddRoles<IdentityRole>()
<<<<<<< Updated upstream
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();
=======
        .AddEntityFrameworkStores<AppDbContext>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<ICheckoutService, CheckoutService>();

>>>>>>> Stashed changes

        return services;
    }
}