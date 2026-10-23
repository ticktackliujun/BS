using Microsoft.EntityFrameworkCore;
using core.Infrastructure.Persistence;

namespace core.Infrastructure;

public static class InfrastructureModule
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "未配置 ConnectionStrings:DefaultConnection。");

        services.AddDbContext<AppDbContext>(options =>
            options.UseMySql(
                connectionString,
                ServerVersion.AutoDetect(connectionString)));

        return services;
    }
}
