using core.Modules.Auth.DTOs;
using core.Modules.Auth.Entities;
using core.Modules.Auth.Repositories;

namespace core.Modules.Auth.Services;

public sealed class UserManagementService(
    IUserManagementRepository repository) : IUserManagementService
{
    public async Task<UserManagementResponse> GetAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 20);

        var totalCount = await repository.CountUsersAsync(cancellationToken);
        var totalPages = totalCount == 0
            ? 0
            : (int)Math.Ceiling(totalCount / (double)pageSize);

        if (totalPages > 0 && page > totalPages)
        {
            page = totalPages;
        }

        var users = await repository.GetUsersPageAsync(
            (page - 1) * pageSize,
            pageSize,
            cancellationToken);
        var roles = await repository.GetRolesAsync(cancellationToken);
        var roleNames = roles.ToDictionary(role => role.Id, role => role.Name);

        return new UserManagementResponse(
            users.Select(user => new UserResponse(
                user.Id,
                user.Username,
                user.RealName,
                user.RoleId,
                roleNames.GetValueOrDefault(user.RoleId, "未知角色")))
                .ToArray(),
            roles.Select(role => new RoleResponse(
                role.Id,
                role.Name,
                role.Description))
                .ToArray(),
            page,
            pageSize,
            totalCount,
            totalPages);
    }

    public async Task<UserResponse> CreateAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        var username = request.Username?.Trim();
        var password = request.Password;
        var realName = request.RealName?.Trim();

        if (string.IsNullOrWhiteSpace(username))
        {
            throw new ArgumentException("账号不能为空。");
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("密码不能为空。");
        }

        if (string.IsNullOrWhiteSpace(realName))
        {
            throw new ArgumentException("姓名不能为空。");
        }

        if (username.Length > 50)
        {
            throw new ArgumentException("账号不能超过 50 个字符。");
        }

        if (password.Length > 100)
        {
            throw new ArgumentException("密码不能超过 100 个字符。");
        }

        if (realName.Length > 50)
        {
            throw new ArgumentException("姓名不能超过 50 个字符。");
        }

        if (await repository.UsernameExistsAsync(
                username,
                cancellationToken))
        {
            throw new InvalidOperationException("账号已存在。");
        }

        var role = await repository.GetRoleAsync(
            request.RoleId,
            cancellationToken)
            ?? throw new ArgumentException("所选角色不存在。");

        var user = new User
        {
            Username = username,
            Password = password,
            RealName = realName,
            RoleId = role.Id
        };

        repository.Add(user);
        await repository.SaveChangesAsync(cancellationToken);

        return new UserResponse(
            user.Id,
            user.Username,
            user.RealName,
            user.RoleId,
            role.Name);
    }

    public async Task<UserResponse> UpdateAsync(
        int userId,
        UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var user = await repository.GetUserAsync(
            userId,
            cancellationToken)
            ?? throw new KeyNotFoundException("用户不存在。");

        if (request.Password is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ArgumentException("密码不能为空。");
            }

            if (request.Password.Length > 100)
            {
                throw new ArgumentException("密码不能超过 100 个字符。");
            }

            user.Password = request.Password;
        }

        if (request.RealName is not null)
        {
            var realName = request.RealName.Trim();

            if (string.IsNullOrWhiteSpace(realName))
            {
                throw new ArgumentException("姓名不能为空。");
            }

            if (realName.Length > 50)
            {
                throw new ArgumentException("姓名不能超过 50 个字符。");
            }

            user.RealName = realName;
        }

        Role? role = null;

        if (request.RoleId is not null)
        {
            role = await repository.GetRoleAsync(
                request.RoleId.Value,
                cancellationToken)
                ?? throw new ArgumentException("所选角色不存在。");

            user.RoleId = role.Id;
        }

        await repository.SaveChangesAsync(cancellationToken);

        role ??= await repository.GetRoleAsync(
            user.RoleId,
            cancellationToken)
            ?? throw new InvalidOperationException("用户角色不存在。");

        return new UserResponse(
            user.Id,
            user.Username,
            user.RealName,
            user.RoleId,
            role.Name);
    }
}
