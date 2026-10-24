using core.Modules.Auth.Entities;

namespace core.Modules.Auth.Repositories;

public interface IUserManagementRepository
{
    Task<int> CountUsersAsync(
        CancellationToken cancellationToken);

    Task<IReadOnlyList<User>> GetUsersPageAsync(
        int skip,
        int take,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Role>> GetRolesAsync(
        CancellationToken cancellationToken);

    Task<bool> UsernameExistsAsync(
        string username,
        CancellationToken cancellationToken);

    Task<Role?> GetRoleAsync(
        int roleId,
        CancellationToken cancellationToken);

    Task<User?> GetUserAsync(
        int userId,
        CancellationToken cancellationToken);

    void Add(User user);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
