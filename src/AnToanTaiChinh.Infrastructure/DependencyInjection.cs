using Microsoft.Extensions.DependencyInjection;

namespace AnToanTaiChinh.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        // Register persistence and external-service implementations here when
        // their contracts and schemas have been approved.
        return services;
    }
}
