using System.Text;
using API.Settings;
using Infrastructure;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularClient", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddInfrastructure(builder.Configuration);

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

app.UseHttpsRedirection();
app.UseCors("AngularClient");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
