namespace core.Modules.Auth.DTOs;

/// <summary>用户管理列表中的用户信息。</summary>
public sealed record UserResponse(
    int Id,
    string Username,
    string RealName,
    int RoleId,
    string RoleName);

/// <summary>可分配的角色。</summary>
public sealed record RoleResponse(
    int Id,
    string Name,
    string? Description);

/// <summary>用户和角色列表。</summary>
public sealed record UserManagementResponse(
    IReadOnlyList<UserResponse> Users,
    IReadOnlyList<RoleResponse> Roles,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

/// <summary>新增用户时提交的数据。</summary>
public sealed record CreateUserRequest(
    string? Username,
    string? Password,
    string? RealName,
    int RoleId);

/// <summary>编辑用户时提交的数据；密码为空表示不修改。</summary>
public sealed record UpdateUserRequest(
    string? Password,
    string? RealName,
    int? RoleId);
