FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY SEAL.NET.csproj ./
RUN dotnet restore SEAL.NET.csproj

COPY . ./
RUN dotnet publish SEAL.NET.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish ./

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "dotnet SEAL.NET.dll --urls http://0.0.0.0:${PORT:-8080}"]
