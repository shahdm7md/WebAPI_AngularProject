using System.Net;
using System.Text.Json;

namespace API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger; // ← أضف logger

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (KeyNotFoundException ex)
        {
            await WriteErrorAsync(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await WriteErrorAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteErrorAsync(context, HttpStatusCode.Unauthorized, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);

            // في Development بعت الـ error الحقيقي
            var message = context.RequestServices
                .GetRequiredService<IWebHostEnvironment>()
                .IsDevelopment()
                    ? $"{ex.Message} | {ex.InnerException?.Message}"
                    : "An unexpected error occurred.";

            await WriteErrorAsync(context, HttpStatusCode.InternalServerError, message);
        }
    }

    private static Task WriteErrorAsync(HttpContext ctx, HttpStatusCode code, string message)
    {
        ctx.Response.StatusCode = (int)code;
        ctx.Response.ContentType = "application/json";
        var body = JsonSerializer.Serialize(new { error = message });
        return ctx.Response.WriteAsync(body);
    }
}