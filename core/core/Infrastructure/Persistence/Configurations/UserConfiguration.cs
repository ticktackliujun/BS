using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using core.Modules.Auth.Entities;

namespace core.Infrastructure.Persistence.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(user => user.Id);

        builder.Property(user => user.Id)
            .ValueGeneratedOnAdd();

        builder.Property(user => user.Username)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(user => user.Username)
            .IsUnique();

        builder.Property(user => user.Password)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(user => user.RealName)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasOne<Role>()
            .WithMany()
            .HasForeignKey(user => user.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
