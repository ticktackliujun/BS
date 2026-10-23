using core.Modules.Auth.DTOs;

namespace core.Modules.Auth.Services;

public interface IAuthService
{
    Task<CurrentUserResponse?> AuthenticateAsync(
        string username,
        string password,
        CancellationToken cancellationToken);
}
