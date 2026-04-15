using System.Net;
using System.Text.Json;

namespace API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
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
            await WriteErrorAsync(context, HttpStatusCode.InternalServerError,
                "An unexpected error occurred.");
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