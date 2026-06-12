using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace MapDistance
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddRazorPages();
            builder.Services.AddControllers();

            builder.Services.AddHttpClient("AzureMaps", client =>
            {
                client.Timeout = TimeSpan.FromSeconds(10);
            });

            builder.Services.AddRateLimiter(options =>
            {
                options.AddFixedWindowLimiter("maps", limiter =>
                {
                    limiter.PermitLimit = 60;
                    limiter.Window = TimeSpan.FromMinutes(1);
                    limiter.QueueLimit = 0;
                });
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            });

            var app = builder.Build();

            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();

            app.UseRouting();

            app.UseRateLimiter();

            app.UseAuthorization();

            app.MapStaticAssets();
            app.MapRazorPages()
               .WithStaticAssets();
            app.MapControllers();

            app.Run();
        }
    }
}
