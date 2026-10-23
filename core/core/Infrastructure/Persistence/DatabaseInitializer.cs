using Microsoft.EntityFrameworkCore;
using core.Modules.Auth.Entities;

namespace core.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    private const string AdminUsername = "admin";
    private const string AdminPassword = "123456";
    private const string AdminRealName = "系统管理员";
    private const string AdminRoleName = "项目管理员";

    public static async Task InitializeDatabaseAsync(
        this WebApplication app)
    {
        await using var scope =
            app.Services.CreateAsyncScope();

        var dbContext = scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

        await dbContext.Database.EnsureCreatedAsync();

        var adminExists = await dbContext.Users
            .AnyAsync(user => user.Username == AdminUsername);

        if (adminExists)
        {
            return;
        }

        var adminRoleId = await dbContext.Roles
            .Where(role => role.Name == AdminRoleName)
            .Select(role => (int?)role.Id)
            .SingleOrDefaultAsync();

        if (adminRoleId is null)
        {
            throw new InvalidOperationException(
                $"缺少角色：{AdminRoleName}。");
        }

        dbContext.Users.Add(new User
        {
            Username = AdminUsername,
            Password = AdminPassword,
            RealName = AdminRealName,
            RoleId = adminRoleId.Value
        });

        await dbContext.SaveChangesAsync();
    }
}
