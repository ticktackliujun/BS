using core.Modules.Warehouse.Repositories;
using core.Modules.Warehouse.Services;

namespace core.Modules.Warehouse;

public static class WarehouseModule
{
    public static IServiceCollection AddWarehouseModule(
        this IServiceCollection services)
    {
        services.AddSingleton<
            IPartQuantityRepository,
            PartQuantityRepository>();
        services.AddScoped<
            IPartQuantityService,
            PartQuantityService>();

        return services;
    }
}
