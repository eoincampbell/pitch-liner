using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MapDistance.Api;

/// <summary>
/// Server-side proxy for Azure Maps API calls.
/// Keeps the subscription key out of client-side code.
/// </summary>
[ApiController]
[Route("api/maps")]
[EnableRateLimiting("maps")]
public class AzureMapsProxyController(IHttpClientFactory httpClientFactory, IConfiguration configuration) : ControllerBase
{
    private string SubscriptionKey =>
        configuration["AzureMaps:SubscriptionKey"]
        ?? throw new InvalidOperationException("AzureMaps:SubscriptionKey is not configured.");

    /// <summary>
    /// Returns the subscription key for the Azure Maps SDK map control initialisation.
    /// In production, replace with a short-lived Microsoft Entra ID token.
    /// </summary>
    [HttpGet("token")]
    public IActionResult GetToken()
    {
        return Ok(new { subscriptionKey = SubscriptionKey });
    }

    /// <summary>
    /// Proxies address search requests to the Azure Maps Search API.
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 3)
            return BadRequest(new { error = "Query must be at least 3 characters." });

        var client = httpClientFactory.CreateClient("AzureMaps");
        var url = $"https://atlas.microsoft.com/search/address/json?api-version=1.0&query={Uri.EscapeDataString(q)}&subscription-key={SubscriptionKey}&limit=5";

        var response = await client.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json");
    }

    /// <summary>
    /// Proxies elevation requests to the Azure Maps Elevation API.
    /// </summary>
    [HttpGet("elevation")]
    public async Task<IActionResult> Elevation([FromQuery] string points)
    {
        if (string.IsNullOrWhiteSpace(points))
            return BadRequest(new { error = "Points parameter is required." });

        var client = httpClientFactory.CreateClient("AzureMaps");
        var url = $"https://atlas.microsoft.com/elevation/point/json?api-version=1.0&points={Uri.EscapeDataString(points)}&subscription-key={SubscriptionKey}";

        var response = await client.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json");
    }
}
