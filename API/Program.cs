using API.Middleware;
using API.Services;
using API.Settings;
using Application.Services;
using Core.Interfaces;
using Core.Interfaces.Repositories;
using Core.Interfaces.Services;
using Infrastructure;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Infrastructure.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
    options.AddOperationTransformer<AuthOperationTransformer>();
});


builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularClient", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:63330")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection(EmailSettings.SectionName));
builder.Services.Configure<GoogleAuthOptions>(builder.Configuration.GetSection(GoogleAuthOptions.SectionName));
builder.Services.Configure<PayPalOptions>(builder.Configuration.GetSection(PayPalOptions.SectionName));
builder.Services.Configure<StripeOptions>(builder.Configuration.GetSection(StripeOptions.SectionName));
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IAdminProductService, AdminProductService>();
builder.Services.AddScoped<IAdminOrderService, AdminOrderService>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IBannerService, BannerService>();
builder.Services.AddScoped<ISellerService, SellerService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<ISellerRepository, SellerRepository>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IOrderHistoryService, OrderHistoryService>();
builder.Services.AddSingleton<IFileStorageService>(_ =>
    new LocalFileStorageService(
        rootPath: builder.Environment.WebRootPath,
        baseUrl: "https://yourdomain.com/uploads"
    ));


var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("JWT settings are not configured.");

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtOptions.Issuer,
        ValidAudience = jwtOptions.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});


var app = builder.Build();

await IdentitySeeder.SeedAsync(app.Services);
await GovernorateSeeder.SeedAsync(app.Services);

if (app.Environment.IsDevelopment())
{
        app.MapOpenApi();
        app.MapGet("/swagger", () => Results.Redirect("/swagger/index.html"));
        app.MapGet("/swagger/index.html", () =>
                Results.Content(
                        """
                        <!doctype html>
                        <html>
                        <head>
                            <meta charset="utf-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1" />
                            <title>Ecommerce API Docs</title>
                            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
                        </head>
                        <body>
                            <div id="swagger-ui"></div>
                            <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
                            <script>
                                window.ui = SwaggerUIBundle({
                                    url: '/openapi/v1.json',
                                    dom_id: '#swagger-ui',
                                    deepLinking: true,
                                    presets: [SwaggerUIBundle.presets.apis],
                                });
                            </script>
                        </body>
                        </html>
                        """,
                        "text/html"));
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AngularClient");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.UseStaticFiles();


app.Run();

internal sealed class BearerSecuritySchemeTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste a valid JWT token in the format: Bearer {token}"
        };

        return Task.CompletedTask;
    }
}

internal sealed class AuthOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        var requiresAuthorization = context.Description.ActionDescriptor.EndpointMetadata
            .OfType<AuthorizeAttribute>()
            .Any();

        if (!requiresAuthorization)
        {
            return Task.CompletedTask;
        }

        operation.Security ??= new List<OpenApiSecurityRequirement>();
        operation.Security.Add(new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", context.Document)] = []
        });

        return Task.CompletedTask;
    }
}
