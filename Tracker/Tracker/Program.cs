using Tracker.WebApi.Models;
using Microsoft.OpenApi.Models;
using Tracker;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<TransactionRepository>(); // Register TransactionRepository as a singleton

// Add Swagger services for API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        builder =>
        {
            builder.WithOrigins("*") // Allow all origins, adjust as necessary
                   .AllowAnyHeader()
                   .AllowAnyMethod();
        });
});

var app = builder.Build();

// Use the CORS policy
app.UseCors("AllowAllOrigins");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(); // Enable Swagger in development environment
    app.UseSwaggerUI();
}

app.UseHttpsRedirection(); // Redirect HTTP requests to HTTPS

// Minimal API Endpoints

// Get all budget transactions
app.MapGet("/budgettransaction", (TransactionRepository repository) =>
{
    return Results.Ok(repository.GetAll());
});

// Get a budget transaction by ID
app.MapGet("/budgettransaction/{id}", (int id, TransactionRepository repository) =>
{
    var transaction = repository.GetById(id);
    return transaction != null ? Results.Ok(transaction) : Results.NotFound();
});


// Get budget transactions by category type (income or expense)
app.MapGet("/budgettransaction/byCategory/{categoryType}", (string categoryType, TransactionRepository repository) =>
{
    var transactions = repository.GetByCategory(categoryType);
    return Results.Ok(transactions);
});

// Add a new budget transaction
app.MapPost("/budgettransaction", (BudgetTransaction transaction, TransactionRepository repository) =>
{
    repository.Add(transaction);
    return Results.Ok(transaction);
});

// Update an existing budget transaction by ID
app.MapPut("/budgettransaction/{id}", (int id, BudgetTransaction transaction, TransactionRepository repository) =>
{
    var existingTransaction = repository.GetById(id);
    if (existingTransaction == null)
    {
        return Results.NotFound();
    }
    transaction.Id = id;
    repository.Update(transaction);
    return Results.Ok(transaction);
});

// Delete a budget transaction by ID
app.MapDelete("/budgettransaction/{id}", (int id, TransactionRepository repository) =>
{
    repository.Delete(id);
    return Results.NoContent();
});

app.Run(); // Run the application
