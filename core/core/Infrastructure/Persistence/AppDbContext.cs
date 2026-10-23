using Microsoft.EntityFrameworkCore;
using core.Modules.Auth.Entities;

namespace core.Infrastructure.Persistence;

public sealed class AppDbContext(
    DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles => Set<Role>();

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);
    }
}
