FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY SEAL.NET.csproj ./
RUN dotnet restore SEAL.NET.csproj

COPY . ./
RUN dotnet publish SEAL.NET.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# The host watches appsettings files so it can reload configuration while
# running, and each watcher costs an inotify instance. Small containers share a
# low per-user limit, and when it is exhausted the process dies inside
# WebApplication.CreateBuilder before any of our code runs. Nothing is lost by
# turning it off: every setting here arrives through environment variables, and
# nobody edits configuration files on a running container.
ENV DOTNET_hostBuilder__reloadConfigOnChange=false

COPY --from=build /app/publish ./

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "dotnet SEAL.NET.dll --urls http://0.0.0.0:${PORT:-8080}"]
