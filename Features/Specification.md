# MapDistance – Project Specification

## 1. Overview

**MapDistance** is a web application built for **Whitehall Colmcille GAA** that enables coaches and groundskeepers to measure distances and areas on an interactive satellite map. Users click on the map to place pins, and the application calculates straight-line distances between them in real time. It is designed for practical field-side use — for example, measuring and verifying pitch markings down to the nearest metre.

The application is built as an **ASP.NET Core Razor Pages** project targeting **.NET 10**, with all interactive functionality implemented as client-side JavaScript using the **Azure Maps Web SDK v3**.

---

## 2. Feature Summary

The application was developed incrementally across four feature rounds, documented in the `Features/Feature Files/` folder. Below is the consolidated feature set as currently implemented.

### 2.1 Core Map & Pin Placement *(001 Initial Spec)*

| Feature | Description |
|---|---|
| Full-page Azure Map | The map fills the entire browser viewport using Azure Maps SDK v3. |
| Default view | Satellite/aerial mode, zoom level 18, centred on 53.386252, -6.241229 (Whitehall Colmcille GAA grounds). |
| Pin placement | Clicking the map places a red pin marker (reduced size, 0.7 scale). |
| Stats panel | A semi-transparent dark overlay (top-left) displays a table of all pins with: Pin #, Latitude, Longitude, Distance from Previous Pin, and cumulative Total Distance. |
| Clear | Removes all pins, lines, and resets the stats table. |

### 2.2 UI Enhancements & Tooling *(002 Requirements Gathering)*

| Feature | Description |
|---|---|
| Dotted connecting lines | Red dashed lines are drawn between consecutive pins. |
| Map controls | On-screen buttons (bottom-right) for zoom in/out, reset to default view, and toggle between aerial/road map styles. |
| Save to CSV | Downloads all pin data as `pin_data.csv`. |
| Load from CSV | Uploads a CSV and reconstructs pins, lines, and table. Includes validation with user-friendly error toasts. |
| Help modal | A modal overlay with full usage instructions. |
| Responsive layout | CSS media queries adapt the stats panel, buttons, search bar, and controls for screens ≤ 600px. |
| Branding | Whitehall Colmcille GAA logo and name displayed in the top-right corner. |
| Address search | A search bar (top-centre) queries the Azure Maps Search API with typeahead suggestions; selecting a result re-centres the map. |

### 2.3 Advanced Measurement Tools *(003 Suggested Features)*

| Feature | Description |
|---|---|
| Undo | Removes the most recent pin on the active path and recalculates distances. |
| Distance unit toggle | Dropdown to switch between metres, yards, kilometres, and miles; all displayed values update in real time. |
| Close Shape / Area calculation | Connects the last pin back to the first with a closing line and calculates enclosed area using the Shoelace formula on Mercator-projected coordinates. Displays area in the selected unit. |
| Pin labels | A toggleable checkbox that shows pin numbers and cumulative distances as text labels on the map (uses a dedicated Azure Maps `SymbolLayer` with `allowOverlap`). |
| Elevation profile | Fetches elevation data from the Azure Maps Elevation API for each pin and renders a mini line chart on a `<canvas>` element (bottom-left). |
| Share via URL | Encodes pin data into the URL hash fragment and copies a shareable link to the clipboard. |

### 2.4 Multiple Paths *(004 Multiple Lines)*

| Feature | Description |
|---|---|
| New Path button | Creates a new independent path; the previous path remains on the map. |
| Distinct path colours | Each path cycles through 8 colour presets (red, blue, green, orange, magenta, teal, gold, purple) for both lines and pin markers. |
| Separate stats sections | Each path has its own header (with colour indicator), table, and subtotal in the stats panel. |
| Independent totals | Each path's distance is tracked separately. |
| Overall total | A grand total across all paths is displayed beneath the per-path sections. |
| Multi-path CSV | The CSV format includes a `Path` column. Loading is backwards-compatible with single-path CSVs. |
| Multi-path URL sharing | The `#paths=` hash format encodes multiple paths separated by `|`, with backward compatibility for legacy `#pins=` URLs. |

### 2.5 Future Ideas *(Future Ideas.md)*

Two features remain documented but not yet implemented:

- **Offline Support (PWA)** – Service worker and cached map tiles for limited-connectivity use.
- **Multiple Measurement Sessions** – Named, switchable pin sets stored independently.

---

## 3. Project Structure & Architecture

### 3.1 Solution Layout

```
MapDistance/
├── MapDistance.csproj              # .NET 10 Razor Pages project file
├── Program.cs                     # Application entry point and middleware pipeline
├── appsettings.json               # Configuration (default)
├── appsettings.Development.json   # Configuration (development)
├── Properties/
│   └── launchSettings.json        # Launch profiles (IIS Express, Kestrel)
├── Pages/
│   ├── _ViewImports.cshtml        # Shared Razor directives (@addTagHelper, @using)
│   ├── _ViewStart.cshtml          # Default Layout assignment
│   ├── Shared/
│   │   ├── _Layout.cshtml         # Shared layout template (used by Privacy, Error)
│   │   ├── _Layout.cshtml.css     # Scoped CSS for the layout
│   │   └── _ValidationScriptsPartial.cshtml
│   ├── Index.cshtml               # ★ Main application page (map + all JS logic)
│   ├── Index.cshtml.cs            # Page model (minimal, no server-side logic)
│   ├── Privacy.cshtml             # Default privacy page
│   ├── Privacy.cshtml.cs
│   ├── Error.cshtml               # Error page
│   └── Error.cshtml.cs
├── Features/
│   ├── Feature Files/
│   │   ├── 001 Initial Spec.md
│   │   ├── 002 Requirements Gathering.md
│   │   ├── 003 Suggested features.md
│   │   └── 004 Multiple Lines.md
│   ├── Future Ideas.md
│   └── Specification.md           # This document
└── wwwroot/
    ├── css/site.css               # Global site styles (not used by Index)
    ├── favicon.ico
    └── lib/
        ├── bootstrap/             # Bootstrap 5 (used by layout pages)
        ├── jquery/                # jQuery (referenced by layout)
        └── jquery-validation/     # jQuery Validation
```

### 3.2 Architectural Decisions

| Decision | Rationale |
|---|---|
| **Single-page client-side app inside Razor Pages** | The Index page sets `Layout = null` and renders a self-contained HTML document. All map logic, state management, and UI is implemented in inline `<script>` and `<style>` blocks. The ASP.NET Core backend serves only as a static host. |
| **No server-side API or database** | All data lives in the browser (JavaScript variables). Persistence is achieved through CSV export/import and URL hash sharing. |
| **Azure Maps SDK v3 (CDN)** | The map control, symbol layers, line layers, math utilities, and search API are all consumed from the Azure Maps CDN. No npm packages or build tooling. |
| **Subscription key authentication** | The Azure Maps subscription key is embedded directly in the client-side JavaScript (acceptable for this internal-use tool). |
| **Inline CSS & JS** | All styles and scripts are embedded in `Index.cshtml` rather than in separate files, keeping the application as a single deployable page. |

### 3.3 Client-Side Architecture

The JavaScript in `Index.cshtml` is structured around several key concepts:

#### Data Model

```
paths[]                          # Array of path objects
  ├── pins[]                     # Array of { lat, lon, distFromPrev, totalDistance }
  ├── totalDistance               # Running total for this path (metres)
  ├── shapeClosed                 # Boolean: whether Close Shape has been applied
  ├── elevations[]               # Elevation values fetched per pin
  ├── pinSource                  # Azure Maps DataSource for pin markers
  ├── lineSource                 # Azure Maps DataSource for connecting lines
  └── closingLineSource          # Azure Maps DataSource for the closing shape line

currentPathIndex                 # Index into paths[] for the active path
currentUnit                      # 'm' | 'yd' | 'km' | 'mi'
```

#### Key Functions

| Function | Purpose |
|---|---|
| `createPathObj(index)` | Factory: creates a new path data object. |
| `initPathSources(path)` | Registers Azure Maps DataSources and Layers for a path with the appropriate colour. |
| `addPin(lat, lon)` | Adds a pin to the current path, calculates distance, updates lines, labels, table, and elevation. |
| `updateTable()` | Rebuilds the entire stats panel DOM from the `paths[]` data model, including per-path subtotals and overall total. |
| `updateLabels()` | Rebuilds the label DataSource with pin numbers and distances for all paths. |
| `formatDist(metres)` | Converts a metre value to the currently selected unit string. |
| `undoLastPin()` | Pops the last pin from the current path and rebuilds its map sources. |
| `closeShape()` | Draws a closing line and triggers area calculation for the current path. |
| `calculateArea(path)` | Computes enclosed area using the Shoelace formula on Mercator-projected pixel coordinates, then converts to real-world m². |
| `saveCsv()` / `loadCsv(event)` | Multi-path CSV serialisation and deserialisation with validation. |
| `shareUrl()` / `loadFromHash()` | URL hash encoding/decoding supporting both `#pins=` (legacy) and `#paths=` (multi-path) formats. |
| `fetchElevation(lat, lon)` | Calls Azure Maps Elevation API and appends to the current path's elevation array. |
| `drawElevationChart()` | Renders the elevation profile on a `<canvas>` element for the active path. |

#### Azure Maps Layers (per path)

1. **LineLayer** – Dashed connecting lines between consecutive pins (path colour).
2. **LineLayer** – Closing shape line (same colour, shorter dash, reduced opacity).
3. **SymbolLayer** – Pin markers (path-coloured built-in marker icon, 0.7 scale, `allowOverlap: true`).

#### Global Layers

4. **SymbolLayer** (`labelLayer`) – Text labels for all pins across all paths; visibility toggled by checkbox.

### 3.4 External Service Dependencies

| Service | Usage | Authentication |
|---|---|---|
| Azure Maps Map Control v3 | Interactive map rendering, satellite imagery, symbol/line layers | Subscription key |
| Azure Maps Search API v1 | Address geocoding for the search bar | Subscription key |
| Azure Maps Elevation API v1 | Per-pin elevation data for the elevation chart | Subscription key |
| Azure Maps Math utilities | `atlas.math.getDistanceTo` for Haversine distance; `atlas.math.mercatorPixelsAtZoom` for area projection | N/A (client-side) |

### 3.5 Responsive Design

A CSS `@media (max-width: 600px)` breakpoint adjusts:

- Stats panel: smaller font, constrained width/height.
- Buttons: reduced padding.
- Branding: smaller logo and text.
- Search bar: narrower, repositioned below branding.
- Map controls: smaller touch targets.
- Elevation panel: narrower max-width.

---

## 4. Data Formats

### 4.1 CSV Format (Multi-Path)

```csv
Path,Pin #,Lat,Long,Distance from Previous Pin,Total Distance
1,1,53.386252,-6.241229,N/A,0m
1,2,53.386244,-6.241233,20m,20m
2,1,53.386300,-6.241100,N/A,0m
```

The loader also accepts the legacy single-path format (no `Path` column), treating all rows as Path 1.

### 4.2 URL Hash Format

**Multi-path (current):**
```
#paths=53.386252,-6.241229;53.386244,-6.241233|53.386300,-6.241100
```
Paths are separated by `|`, pins within a path by `;`.

**Legacy single-path:**
```
#pins=53.386252,-6.241229;53.386244,-6.241233
```

---

## 5. Known Limitations & Technical Debt

| Item | Details |
|---|---|
| **API key in client source** | The Azure Maps subscription key is embedded in the page. Acceptable for internal use but should be proxied through a backend endpoint for public deployment. |
| **All code in one file** | ~960 lines of HTML/CSS/JS in `Index.cshtml`. Extracting JS into a separate `.js` file and CSS into a `.css` file would improve maintainability. |
| **No automated tests** | There are no unit or integration tests for the client-side logic. |
| **DOM rebuilds** | `updateTable()` fully rebuilds the stats panel on every pin change. For very large pin counts this could become slow. |
| **Elevation API availability** | The Azure Maps Elevation API may not return data for all locations; `null` values are handled gracefully in the chart but shown as gaps. |
| **Clearing paths** | `clearAll()` resets data on all path objects but does not remove orphaned Azure Maps layers/sources from previous paths, which accumulate in memory across repeated clear/new-path cycles. |
| **Area calculation precision** | The Shoelace formula on Mercator projection is approximate. For very large areas or high-latitude locations, a geodesic area calculation would be more accurate. |

---

## 6. Feature Development History

| Phase | Document | Features Delivered |
|---|---|---|
| 001 | `001 Initial Spec.md` | Full-page Azure Map, pin placement, stats table, clear button |
| 002 | `002 Requirements Gathering.md` | Red pins, dotted lines, map controls, save/load CSV, help modal, responsive layout, branding, address search |
| 003 | `003 Suggested features.md` | Undo, distance unit toggle, close shape/area, pin labels, elevation profile, share via URL |
| 004 | `004 Multiple Lines.md` | Multiple paths with distinct colours, separate stats, independent totals, overall total, multi-path CSV and URL sharing |
| — | `Future Ideas.md` | PWA offline support, named measurement sessions *(not yet implemented)* |
