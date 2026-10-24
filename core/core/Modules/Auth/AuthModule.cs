using core.Modules.Auth.Repositories;
using core.Modules.Auth.Services;

namespace core.Modules.Auth;

public static class AuthModule
{
    public static IServiceCollection AddAuthModule(
        this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<
            IUserManagementRepository,
            UserManagementRepository>();
        services.AddScoped<
            IUserManagementService,
            UserManagementService>();
        return services;
    }
}
