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
    /// Proxies search requests to the Azure Maps Fuzzy Search API.
    /// Runs both a fuzzy search and a POI-specific search in parallel, then merges
    /// deduplicated results for better local POI coverage (e.g., GAA clubs, sports grounds).
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] double? lat, [FromQuery] double? lon)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 3)
            return BadRequest(new { error = "Query must be at least 3 characters." });

        var client = httpClientFactory.CreateClient("AzureMaps");
        var locationParams = lat.HasValue && lon.HasValue
            ? $"&lat={lat.Value:F6}&lon={lon.Value:F6}&radius=50000"
            : "";
        var commonParams = $"&subscription-key={SubscriptionKey}&countrySet=IE&language=en-IE{locationParams}";

        var fuzzyUrl = $"https://atlas.microsoft.com/search/fuzzy/json?api-version=1.0&query={Uri.EscapeDataString(q)}&limit=6&typeahead=true{commonParams}";
        var poiUrl = $"https://atlas.microsoft.com/search/poi/json?api-version=1.0&query={Uri.EscapeDataString(q)}&limit=4&typeahead=true{commonParams}";

        var fuzzyTask = client.GetStringAsync(fuzzyUrl);
        var poiTask = client.GetStringAsync(poiUrl);

        await Task.WhenAll(fuzzyTask, poiTask);

        var fuzzyJson = await fuzzyTask;
        var poiJson = await poiTask;

        // Merge results: POI results first (more relevant for local places), then fuzzy
        // Client-side handles deduplication by position
        var merged = $"{{\"fuzzy\":{fuzzyJson},\"poi\":{poiJson}}}";
        return Content(merged, "application/json");
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
