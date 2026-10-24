using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace core.Shared.Web;

internal sealed class ApiExceptionHandler(
    ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title, detail) = exception switch
        {
            ArgumentException => (
                StatusCodes.Status400BadRequest,
                "请求参数错误",
                exception.Message),
            KeyNotFoundException => (
                StatusCodes.Status404NotFound,
                "数据不存在",
                exception.Message),
            InvalidOperationException => (
                StatusCodes.Status409Conflict,
                "数据冲突",
                exception.Message),
            DbUpdateException => (
                StatusCodes.Status409Conflict,
                "数据冲突",
                "账号或角色数据冲突，请检查后重试。"),
            JsonException => (
                StatusCodes.Status500InternalServerError,
                "库存数据文件格式错误",
                "服务器无法读取库存数据。"),
            IOException => (
                StatusCodes.Status500InternalServerError,
                "数据文件读写失败",
                "服务器暂时无法保存数据。"),
            _ => (0, string.Empty, string.Empty)
        };

        if (statusCode == 0)
        {
            return false;
        }

        logger.LogError(exception, "Handled API exception: {Title}", title);

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(
            new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Instance = httpContext.Request.Path
            },
            cancellationToken);

        return true;
    }
}
