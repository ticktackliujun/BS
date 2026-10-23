using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using core.Modules.Auth.Entities;

namespace core.Infrastructure.Persistence.Configurations;

internal sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");

        builder.HasKey(role => role.Id);

        builder.Property(role => role.Id)
            .ValueGeneratedOnAdd();

        builder.Property(role => role.Name)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(role => role.Name)
            .IsUnique();

        builder.Property(role => role.Description)
            .HasMaxLength(200);

        builder.HasData(
            new Role
            {
                Id = 1,
                Name = "项目管理员",
                Description = "负责项目管理、用户和权限配置。"
            },
            new Role
            {
                Id = 2,
                Name = "安装工程师",
                Description = "负责安装和装配任务执行。"
            },
            new Role
            {
                Id = 3,
                Name = "仓库管理员",
                Description = "负责库存和领料业务。"
            });
    }
}
