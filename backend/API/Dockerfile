# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy project files
COPY ["API/LogLens.API.csproj", "API/"]
COPY ["Application/LogLens.Application.csproj", "Application/"]
COPY ["Domain/LogLens.Domain.csproj", "Domain/"]
COPY ["Infrastructure/LogLens.Infrastructure.csproj", "Infrastructure/"]
COPY ["ML/LogLens.ML.csproj", "ML/"]

# Restore dependencies
RUN dotnet restore "API/LogLens.API.csproj"

# Copy all source code
COPY . .

# Build the application
RUN dotnet build "API/LogLens.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "API/LogLens.API.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Create non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD dotnet /app/LogLens.API.dll || exit 1

ENTRYPOINT ["dotnet", "LogLens.API.dll"]
