# Dockerfile cho moi truong test on dinh (AI Test Assistant). Build tu thu muc goc repo:
#   docker compose -f compose.local.yml build   (xem compose.local.yml)
# Core Umbraco lay tu feed noi bo src/ANTC.Portal.Lib/Build.Core (da commit), khong build core.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/ANTC.Portal.Lib src/ANTC.Portal.Lib
COPY src/ANTC.Portal.App src/ANTC.Portal.App
RUN dotnet publish src/ANTC.Portal.App/Umbraco.Web.UI/Umbraco.Web.UI.csproj \
    -c Release -o /out -p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /out .
# Thu muc du lieu ben (gan volume trong compose). Thuoc user khong phai root.
RUN mkdir -p /app/App_Data /app/umbraco/Data /app/umbraco/Logs /app/umbraco/models /app/wwwroot/media /app/Keys \
    && chown -R app:app /app
USER app
ENV ASPNETCORE_URLS=http://+:8080 \
    UMBLOGDIR=/app/umbraco/Logs
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=8 \
    CMD curl -fsS -o /dev/null http://localhost:8080/ || exit 1
ENTRYPOINT ["dotnet", "Umbraco.Web.UI.dll"]
