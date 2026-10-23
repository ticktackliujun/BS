using System.Text.Json;

namespace core.Modules.Warehouse.Repositories;

public sealed class PartQuantityRepository
    : IPartQuantityRepository, IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    private readonly SemaphoreSlim gate = new(1, 1);
    private readonly string dataFilePath;

    public PartQuantityRepository(
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        var configuredPath =
            configuration["Inventory:DataFile"] ?? "Data/db.json";

        dataFilePath = Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(environment.ContentRootPath, configuredPath);
    }

    public async Task<int?> ReadAsync(CancellationToken cancellationToken)
    {
        await gate.WaitAsync(cancellationToken);

        try
        {
            if (!File.Exists(dataFilePath))
            {
                return null;
            }

            await using var stream = File.OpenRead(dataFilePath);
            var data = await JsonSerializer.DeserializeAsync<PartQuantityData>(
                stream,
                JsonOptions,
                cancellationToken);

            return data?.Quantity;
        }
        finally
        {
            gate.Release();
        }
    }

    public async Task SaveAsync(
        int quantity,
        CancellationToken cancellationToken)
    {
        await gate.WaitAsync(cancellationToken);

        try
        {
            var directory = Path.GetDirectoryName(dataFilePath);

            if (!string.IsNullOrWhiteSpace(directory))
            {
                Directory.CreateDirectory(directory);
            }

            var json = JsonSerializer.Serialize(
                new PartQuantityData(quantity),
                JsonOptions);

            await File.WriteAllTextAsync(
                dataFilePath,
                json,
                cancellationToken);
        }
        finally
        {
            gate.Release();
        }
    }

    public void Dispose()
    {
        gate.Dispose();
    }
}

internal sealed record PartQuantityData(int Quantity);
