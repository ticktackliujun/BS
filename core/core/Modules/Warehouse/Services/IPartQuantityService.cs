using core.Modules.Warehouse.DTOs;

namespace core.Modules.Warehouse.Services;

public interface IPartQuantityService
{
    Task<PartQuantityResponse> GetAsync(CancellationToken cancellationToken);

    Task<PartQuantityResponse> SaveAsync(
        int quantity,
        CancellationToken cancellationToken);
}
