using core.Modules.Auth.DTOs;

namespace core.Modules.Auth.Services;

public interface IUserManagementService
{
    Task<UserManagementResponse> GetAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<UserResponse> CreateAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken);

    Task<UserResponse> UpdateAsync(
        int userId,
        UpdateUserRequest request,
        CancellationToken cancellationToken);
}
