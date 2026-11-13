# Dockerfile cho Vibe Host (Linux container). Build tu thu muc goc repo.
# Core Umbraco lay tu feed noi bo src/ANTC.Portal.Lib/Build.Core (da commit), khong build core.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/ANTC.Portal.Lib src/ANTC.Portal.Lib
COPY src/ANTC.Portal.App src/ANTC.Portal.App
RUN dotnet publish src/ANTC.Portal.App/Umbraco.Web.UI/Umbraco.Web.UI.csproj \
    -c Release -o /out -p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out .
# Vibe Host kiem tra suc khoe bang curl/wget chay trong container.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
# uSync ghi file .cshtml vao Views khi nhap template, nen Views phai ghi duoc.
# /app/persist: thu muc du lieu ben duy nhat (khai tren Vibe Host), de trong trong image.
# Khi dat ANTC_DATA_DIR, luc khoi dong tao thu muc con; duong dan CSDL/anh/khoa dat bang bien moi truong.
RUN mkdir -p /app/App_Data /app/umbraco/Data /app/umbraco/Logs /app/wwwroot/media /app/Keys /app/persist \
    && chown -R app:app /app/App_Data /app/umbraco /app/wwwroot/media /app/Keys /app/Views /app/persist
USER app
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Staging \
    Deployment__DataProtectionKeysPath=/app/Keys \
    UMBLOGDIR=/app/umbraco/Logs
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "if [ -n \"$ANTC_DATA_DIR\" ]; then mkdir -p \"$ANTC_DATA_DIR/umbraco\" \"$ANTC_DATA_DIR/media\" || exit 1; fi; exec dotnet Umbraco.Web.UI.dll"]
