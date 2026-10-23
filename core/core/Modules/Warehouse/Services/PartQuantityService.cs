using core.Modules.Warehouse.DTOs;
using core.Modules.Warehouse.Repositories;

namespace core.Modules.Warehouse.Services;

public sealed class PartQuantityService(
    IPartQuantityRepository repository) : IPartQuantityService
{
    private const int InitialQuantity = 1;

    public async Task<PartQuantityResponse> GetAsync(
        CancellationToken cancellationToken)
    {
        var quantity = await repository.ReadAsync(cancellationToken);
        return new PartQuantityResponse(quantity ?? InitialQuantity);
    }

    public async Task<PartQuantityResponse> SaveAsync(
        int quantity,
        CancellationToken cancellationToken)
    {
        await repository.SaveAsync(quantity, cancellationToken);
        return new PartQuantityResponse(quantity);
    }
}
