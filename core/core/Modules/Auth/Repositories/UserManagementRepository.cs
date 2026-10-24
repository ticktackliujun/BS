using Microsoft.EntityFrameworkCore;
using core.Infrastructure.Persistence;
using core.Modules.Auth.Entities;

namespace core.Modules.Auth.Repositories;

public sealed class UserManagementRepository(
    AppDbContext dbContext) : IUserManagementRepository
{
    public Task<int> CountUsersAsync(
        CancellationToken cancellationToken)
    {
        return dbContext.Users.CountAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<User>> GetUsersPageAsync(
        int skip,
        int take,
        CancellationToken cancellationToken)
    {
        return await dbContext.Users
            .AsNoTracking()
            .OrderBy(user => user.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Role>> GetRolesAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.Roles
            .AsNoTracking()
            .OrderBy(role => role.Id)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> UsernameExistsAsync(
        string username,
        CancellationToken cancellationToken)
    {
        return dbContext.Users
            .AsNoTracking()
            .AnyAsync(
                user => user.Username == username,
                cancellationToken);
    }

    public Task<Role?> GetRoleAsync(
        int roleId,
        CancellationToken cancellationToken)
    {
        return dbContext.Roles
            .AsNoTracking()
            .SingleOrDefaultAsync(
                role => role.Id == roleId,
                cancellationToken);
    }

    public Task<User?> GetUserAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        return dbContext.Users
            .SingleOrDefaultAsync(
                user => user.Id == userId,
                cancellationToken);
    }

    public void Add(User user)
    {
        dbContext.Users.Add(user);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
