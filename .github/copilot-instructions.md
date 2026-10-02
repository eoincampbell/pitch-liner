# Pitch Liner (MapDistance) instructions

## Commands

- Restore and build: `dotnet build MapDistance.slnx`
- Run locally: `dotnet run --project MapDistance.csproj` (the HTTPS launch profile uses `https://localhost:7278`; HTTP uses `http://localhost:5119`)
- Publish the web app: `dotnet publish MapDistance.csproj -c Release`
- There is currently no test project or lint/format configuration, so no full-suite or single-test command exists.

The project targets .NET 10 (`net10.0`). `appsettings.Development.json` is intentionally gitignored; configure `AzureMaps:SubscriptionKey` locally before exercising map, search, or elevation behavior.

## Architecture

- This is a single-project ASP.NET Core Razor Pages application. `Program.cs` configures Razor Pages, MVC controllers, static assets, and the named `AzureMaps` `HttpClient`; it applies the `maps` fixed-window rate-limit policy before controller routing.
- `Pages/Index.cshtml` is the actual application shell. It opts out of the shared Razor layout (`Layout = null`), loads Azure Maps v3 from the CDN, renders the map UI, and lists all application scripts in their required dependency order. `Pages/Shared/_Layout.cshtml` is only for the conventional secondary Razor pages.
- `Api/AzureMapsProxyController.cs` owns the server-side Azure Maps integration: `/api/maps/token` initializes the SDK, while `/api/maps/search` and `/api/maps/elevation` proxy external API requests. Keep external Azure Maps calls behind these endpoints and configuration rather than adding a subscription key to browser code.
- The browser application is plain ordered scripts, not ES modules. `wwwroot/js/config.js` creates the shared global `MapDistance` namespace/state; each later feature file extends it inside an IIFE. Inline button handlers in `Index.cshtml` require the corresponding `window.*` functions exported by those files.
- `wwwroot/js/map-init.js` fetches the token, waits for the Azure Maps `ready` event, registers every marker sprite, creates the global label layer and first path, then restores URL-hash data. Code that depends on `md.map`, `md.labelSource`, or path sources/layers must run after this boot sequence.
- Measurement state is `MapDistance.paths`: each path has ordered pins, aggregate distance, closed-shape/elevation state, and Azure Maps data sources/layers. `path-manager.js` owns path construction, map geometry, distance recalculation, activation, and cleanup; `stats-table.js`, `area-calc.js`, `elevation.js`, and `pin-drag.js` render or synchronize derived state.

## Repository conventions

- Change map state through the established helpers (`md.addPin`, `md.undoLastPin`, `md.rebuildPathGeometry`, `md.recalcPathDistances`, `md.refreshActivePathUi`) instead of mutating pins or Azure Maps sources independently. A pin feature must retain its `{ pathId, pinIndex }` properties so drag handling can resolve its owning path. Keep `path.elevations` aligned by pin index.
- When a path is closed, rebuild its closing line, polygon fill, and centroid label with `md.refreshClosedShape`; adding or undoing pins deliberately reopens it. Dragging updates geometry/labels live but defers the table, area UI, and elevation refresh until drop.
- Coordinates passed to Azure Maps and stored in map features are `[longitude, latitude]`; pin objects and CSV/hash payloads store `lat` then `lon`. Preserve that conversion boundary.
- Add browser scripts to `Index.cshtml` after the helpers they consume and before `map-init.js`, which must remain last. Keep DOM IDs, inline callback names, and CSS selectors synchronized: the tour and controls target them directly.
- Update all persistence paths together when changing measurement data: CSV (`csv-io.js`) and compressed `#d=` share payloads (`share.js`) retain path names, colours, closed shapes, selected location, and camera state. Continue accepting the documented legacy `#pins=`/`#paths=` hashes and older CSV layouts.
- Keep input limits enforced in the client loader (`MAX_CSV_SIZE`, `MAX_CSV_ROWS`) and let the proxy controller validate query inputs. The search proxy returns distinct `poi` and `fuzzy` result sets; the client deliberately ranks POIs first and deduplicates positions.
- Venue definitions and the colour palette are centralized in `config.js`. Location centers are `[lon, lat]`; palette indexes map directly to marker sprite IDs created during map initialization.
- `Features/Specification.md` is the consolidated product behavior, and the numbered files under `Features/Feature Files/` capture incremental requirements. Update the relevant feature documentation when behavior changes.
