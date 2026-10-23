namespace core.Modules.Warehouse.Repositories;

public interface IPartQuantityRepository
{
    Task<int?> ReadAsync(CancellationToken cancellationToken);

    Task SaveAsync(int quantity, CancellationToken cancellationToken);
}
