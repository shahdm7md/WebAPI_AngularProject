using Core.Entities;
using SharedKernel.Enums;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<ProductImage> ProductImages => Set<ProductImage>();

    public DbSet<Cart> Carts => Set<Cart>();

    public DbSet<CartItem> CartItems => Set<CartItem>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public DbSet<Review> Reviews => Set<Review>();

    public DbSet<Wishlist> Wishlists => Set<Wishlist>();

    public DbSet<Coupon> Coupons => Set<Coupon>();

    public DbSet<CouponUsage> CouponUsages => Set<CouponUsage>();

    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.FullName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(user => user.OtpCode)
                .HasMaxLength(20);

            entity.Property(user => user.RefreshToken)
                .HasMaxLength(500);

            entity.Property(user => user.SellerStatus)
                .HasMaxLength(50)
                .HasDefaultValue("Pending");

            entity.Property(user => user.StoreName)
                .HasMaxLength(200);

            entity.Property(user => user.StoreDescription)
                .HasMaxLength(2000);

            entity.Property(user => user.WalletBalance)
                .HasPrecision(18, 2)
                .HasDefaultValue(0m);

            entity.Property(user => user.Address)
                .HasMaxLength(500);

            entity.Property(user => user.IsActive)
                .HasDefaultValue(true);

            entity.Property(user => user.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(category => category.Name)
                .IsRequired()
                .HasMaxLength(150);

            entity.HasIndex(category => category.Name)
                .IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(product => product.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(product => product.Description)
                .HasMaxLength(2000);

            entity.Property(product => product.Price)
                .HasPrecision(18, 2);

            entity.Property(product => product.StockQuantity)
                .IsRequired();

            entity.Property(product => product.SellerId)
                .IsRequired();

            entity.Property(product => product.CategoryId)
                .IsRequired();

            entity.HasOne(product => product.Seller)
                .WithMany(user => user.SoldProducts)
                .HasForeignKey(product => product.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(product => product.Category)
                .WithMany(category => category.Products)
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.Property(image => image.ImageUrl)
                .IsRequired()
                .HasMaxLength(500);

            entity.HasOne(image => image.Product)
                .WithMany(product => product.Images)
                .HasForeignKey(image => image.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(image => new { image.ProductId, image.IsMain });
        });

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.Property(cart => cart.UserId)
                .IsRequired();

            entity.HasOne(cart => cart.User)
                .WithMany(user => user.Carts)
                .HasForeignKey(cart => cart.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(cart => cart.UserId)
                .IsUnique();
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.Property(item => item.Quantity)
                .IsRequired();

            entity.HasOne(item => item.Cart)
                .WithMany(cart => cart.Items)
                .HasForeignKey(item => item.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(item => item.Product)
                .WithMany(product => product.CartItems)
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(item => new { item.CartId, item.ProductId })
                .IsUnique();
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(order => order.TotalAmount)
                .HasPrecision(18, 2);

            entity.Property(order => order.Status)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(order => order.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(order => order.User)
                .WithMany(user => user.Orders)
                .HasForeignKey(order => order.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(item => item.Price)
                .HasPrecision(18, 2);

            entity.Property(item => item.Quantity)
                .IsRequired();

            entity.HasOne(item => item.Order)
                .WithMany(order => order.Items)
                .HasForeignKey(item => item.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(item => item.Product)
                .WithMany(product => product.OrderItems)
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.Property(review => review.Rating)
                .IsRequired();

            entity.Property(review => review.Comment)
                .HasMaxLength(2000);

            entity.Property(review => review.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(review => review.User)
                .WithMany(user => user.Reviews)
                .HasForeignKey(review => review.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(review => review.Product)
                .WithMany(product => product.Reviews)
                .HasForeignKey(review => review.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(review => new { review.UserId, review.ProductId })
                .IsUnique();
        });

        modelBuilder.Entity<Wishlist>(entity =>
        {
            entity.HasOne(wishlist => wishlist.User)
                .WithMany(user => user.Wishlists)
                .HasForeignKey(wishlist => wishlist.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(wishlist => wishlist.Product)
                .WithMany(product => product.Wishlists)
                .HasForeignKey(wishlist => wishlist.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(wishlist => new { wishlist.UserId, wishlist.ProductId })
                .IsUnique();
        });

        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.Property(coupon => coupon.Code)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(coupon => coupon.DiscountType)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(coupon => coupon.Value)
                .HasPrecision(18, 2);

            entity.Property(coupon => coupon.ExpiryDate)
                .IsRequired();

            entity.Property(coupon => coupon.UsageLimit)
                .IsRequired();

            entity.HasIndex(coupon => coupon.Code)
                .IsUnique();
        });

        modelBuilder.Entity<CouponUsage>(entity =>
        {
            entity.Property(usage => usage.UsedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(usage => usage.Coupon)
                .WithMany(coupon => coupon.Usages)
                .HasForeignKey(usage => usage.CouponId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(usage => usage.User)
                .WithMany(user => user.CouponUsages)
                .HasForeignKey(usage => usage.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(usage => new { usage.CouponId, usage.UserId })
                .IsUnique();
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.Property(payment => payment.PaymentMethod)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(payment => payment.Status)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(payment => payment.TransactionId)
                .HasMaxLength(200);

            entity.HasOne(payment => payment.Order)
                .WithOne(order => order.Payment)
                .HasForeignKey<Payment>(payment => payment.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(payment => payment.OrderId)
                .IsUnique();
        });
    }
}