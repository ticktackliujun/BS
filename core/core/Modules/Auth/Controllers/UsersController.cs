using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using core.Modules.Auth.DTOs;
using core.Modules.Auth.Services;

namespace core.Modules.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public sealed class UsersController(
    IUserManagementService userManagementService) : ControllerBase
{
    /// <summary>读取用户和可分配角色。</summary>
    [HttpGet]
    [ProducesResponseType<UserManagementResponse>(
        StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(
        StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserManagementResponse>> Get(
        CancellationToken cancellationToken,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        return Ok(await userManagementService.GetAsync(
            page,
            pageSize,
            cancellationToken));
    }

    /// <summary>新增用户。</summary>
    [HttpPost]
    [ProducesResponseType<UserResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(
        StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserResponse>> Create(
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        var user = await userManagementService.CreateAsync(
            request,
            cancellationToken);

        return Created("/api/Users", user);
    }

    /// <summary>修改姓名、角色或重置密码。</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> Update(
        int id,
        [FromBody] UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await userManagementService.UpdateAsync(
            id,
            request,
            cancellationToken));
    }
}
