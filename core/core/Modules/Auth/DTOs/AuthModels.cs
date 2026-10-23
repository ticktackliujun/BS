namespace core.Modules.Auth.DTOs;

/// <summary>登录时提交的账号和密码。</summary>
public sealed record LoginRequest(string? Username, string? Password);

/// <summary>登录成功后的当前用户和角色。</summary>
public sealed record CurrentUserResponse(
    string Username,
    string DisplayName,
    string Role,
    string RoleLabel);

/// <summary>登录接口的返回结果。</summary>
public sealed record LoginResponse(CurrentUserResponse User);
