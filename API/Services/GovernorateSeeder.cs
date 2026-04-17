using Core.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public static class GovernorateSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var governorates = new[]
        {
            new Governorate { Name = "Cairo", NameAr = "القاهرة", ShippingCost = 55m, IsActive = true },
            new Governorate { Name = "Giza", NameAr = "الجيزة", ShippingCost = 60m, IsActive = true },
            new Governorate { Name = "Alexandria", NameAr = "الإسكندرية", ShippingCost = 70m, IsActive = true },
            new Governorate { Name = "Qalyubia", NameAr = "القليوبية", ShippingCost = 58m, IsActive = true },
            new Governorate { Name = "Port Said", NameAr = "بورسعيد", ShippingCost = 75m, IsActive = true },
            new Governorate { Name = "Suez", NameAr = "السويس", ShippingCost = 78m, IsActive = true },
            new Governorate { Name = "Ismailia", NameAr = "الإسماعيلية", ShippingCost = 80m, IsActive = true },
            new Governorate { Name = "Damietta", NameAr = "دمياط", ShippingCost = 72m, IsActive = true },
            new Governorate { Name = "Dakahlia", NameAr = "الدقهلية", ShippingCost = 65m, IsActive = true },
            new Governorate { Name = "Sharqia", NameAr = "الشرقية", ShippingCost = 68m, IsActive = true },
            new Governorate { Name = "Gharbia", NameAr = "الغربية", ShippingCost = 66m, IsActive = true },
            new Governorate { Name = "Monufia", NameAr = "المنوفية", ShippingCost = 64m, IsActive = true },
            new Governorate { Name = "Beheira", NameAr = "البحيرة", ShippingCost = 74m, IsActive = true },
            new Governorate { Name = "Kafr El Sheikh", NameAr = "كفر الشيخ", ShippingCost = 73m, IsActive = true },
            new Governorate { Name = "Fayoum", NameAr = "الفيوم", ShippingCost = 69m, IsActive = true },
            new Governorate { Name = "Beni Suef", NameAr = "بني سويف", ShippingCost = 71m, IsActive = true },
            new Governorate { Name = "Minya", NameAr = "المنيا", ShippingCost = 82m, IsActive = true },
            new Governorate { Name = "Assiut", NameAr = "أسيوط", ShippingCost = 85m, IsActive = true },
            new Governorate { Name = "Sohag", NameAr = "سوهاج", ShippingCost = 88m, IsActive = true },
            new Governorate { Name = "Qena", NameAr = "قنا", ShippingCost = 92m, IsActive = true },
            new Governorate { Name = "Luxor", NameAr = "الأقصر", ShippingCost = 95m, IsActive = true },
            new Governorate { Name = "Aswan", NameAr = "أسوان", ShippingCost = 100m, IsActive = true },
            new Governorate { Name = "Red Sea", NameAr = "البحر الأحمر", ShippingCost = 110m, IsActive = true },
            new Governorate { Name = "New Valley", NameAr = "الوادي الجديد", ShippingCost = 120m, IsActive = true },
            new Governorate { Name = "Matrouh", NameAr = "مطروح", ShippingCost = 105m, IsActive = true },
            new Governorate { Name = "North Sinai", NameAr = "شمال سيناء", ShippingCost = 115m, IsActive = true },
            new Governorate { Name = "South Sinai", NameAr = "جنوب سيناء", ShippingCost = 125m, IsActive = true }
        };

        foreach (var governorate in governorates)
        {
            var existing = await context.Governorates.FirstOrDefaultAsync(g => g.Name == governorate.Name);
            if (existing is null)
            {
                context.Governorates.Add(governorate);
                continue;
            }

            existing.NameAr = governorate.NameAr;
            existing.ShippingCost = governorate.ShippingCost;
            existing.IsActive = true;
        }

        await context.SaveChangesAsync();
    }
}
