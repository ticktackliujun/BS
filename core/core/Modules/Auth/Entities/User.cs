namespace core.Modules.Auth.Entities;

public sealed class User
{
    public int Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string RealName { get; set; } = string.Empty;

    public int RoleId { get; set; }
}
