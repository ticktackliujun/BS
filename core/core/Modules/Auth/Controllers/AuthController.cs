using Microsoft.AspNetCore.Mvc;
using core.Modules.Auth.DTOs;
using core.Modules.Auth.Services;

namespace core.Modules.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public sealed class AuthController(
    IAuthService authService) : ControllerBase
{
    /// <summary>使用账号和密码登录。</summary>
    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(
        StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var username = request.Username?.Trim();
        var password = request.Password;
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(username))
        {
            errors["username"] = ["账号不能为空。"];
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            errors["password"] = ["密码不能为空。"];
        }

        if (errors.Count > 0)
        {
            return ValidationProblem(new ValidationProblemDetails(errors));
        }

        var user = await authService.AuthenticateAsync(
            username!,
            password!,
            cancellationToken);

        if (user is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "登录失败",
                Detail = "账号或密码错误。",
                Instance = HttpContext.Request.Path
            });
        }

        return Ok(new LoginResponse(user));
    }
}
