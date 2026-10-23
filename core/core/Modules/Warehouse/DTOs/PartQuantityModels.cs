namespace core.Modules.Warehouse.DTOs;

/// <summary>零件当前的库存数量。</summary>
public sealed record PartQuantityResponse(int Quantity);

/// <summary>保存零件库存数量时提交的数据。</summary>
public sealed record SavePartQuantityRequest(int Quantity);
