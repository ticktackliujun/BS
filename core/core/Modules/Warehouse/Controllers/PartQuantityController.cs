using Microsoft.AspNetCore.Mvc;
using core.Modules.Warehouse.DTOs;
using core.Modules.Warehouse.Services;

namespace core.Modules.Warehouse.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public sealed class PartQuantityController(
    IPartQuantityService service) : ControllerBase
{
    /// <summary>读取零件当前数量。</summary>
    [HttpGet]
    [ProducesResponseType<PartQuantityResponse>(
        StatusCodes.Status200OK)]
    public async Task<ActionResult<PartQuantityResponse>> Get(
        CancellationToken cancellationToken)
    {
        var result = await service.GetAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>保存零件数量。</summary>
    [HttpPut]
    [ProducesResponseType<PartQuantityResponse>(
        StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(
        StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PartQuantityResponse>> Put(
        [FromBody] SavePartQuantityRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Quantity < 0 || request.Quantity > 1_000_000)
        {
            ModelState.AddModelError(
                nameof(request.Quantity),
                "数量必须在 0 到 1000000 之间。");

            return ValidationProblem(ModelState);
        }

        var result = await service.SaveAsync(
            request.Quantity,
            cancellationToken);

        return Ok(result);
    }
}
