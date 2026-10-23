using Microsoft.EntityFrameworkCore;
using core.Infrastructure.Persistence;
using core.Modules.Auth.DTOs;

namespace core.Modules.Auth.Services;

public sealed class AuthService(
    AppDbContext dbContext) : IAuthService
{
    public async Task<CurrentUserResponse?> AuthenticateAsync(
        string username,
        string password,
        CancellationToken cancellationToken)
    {
        var account = await (
            from user in dbContext.Users.AsNoTracking()
            join role in dbContext.Roles.AsNoTracking()
                on user.RoleId equals role.Id
            where user.Username == username
            select new
            {
                user.Username,
                user.Password,
                user.RealName,
                RoleName = role.Name
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (
            account is null ||
            !string.Equals(
                account.Password,
                password,
                StringComparison.Ordinal))
        {
            return null;
        }

        var roleCode = account.RoleName switch
        {
            "项目管理员" => "admin",
            "安装工程师" => "engineer",
            "仓库管理员" => "warehouse",
            _ => "unknown"
        };

        return new CurrentUserResponse(
            account.Username,
            account.RealName,
            roleCode,
            account.RoleName);
    }
}
