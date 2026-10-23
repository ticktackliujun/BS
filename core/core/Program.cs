using core.Infrastructure;
using core.Infrastructure.Persistence;
using core.Modules.Auth;
using core.Modules.Warehouse;
using core.Shared.Web;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddControllers();

builder.Services.AddAuthModule();
builder.Services.AddWarehouseModule();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.MapControllers();

await app.InitializeDatabaseAsync();

app.Run();
