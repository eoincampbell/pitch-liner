/**
 * MapDistance – Share via URL and load from URL hash.
 */
(function (md) {
    'use strict';

    function shareUrl() {
        var hasData = md.paths.some(function (p) { return p.pins.length > 0; });
        if (!hasData) { md.showError('No pins to share.'); return; }
        var parts = [];
        var names = [];
        var closed = [];
        for (var pi = 0; pi < md.paths.length; pi++) {
            if (md.paths[pi].pins.length === 0) continue;
            var coords = md.paths[pi].pins.map(function (p) { return p.lat.toFixed(6) + ',' + p.lon.toFixed(6); });
            parts.push(coords.join(';'));
            names.push(md.paths[pi].name);
            closed.push(md.paths[pi].shapeClosed ? '1' : '0');
        }
        var url = window.location.origin + window.location.pathname + '#paths=' + encodeURIComponent(parts.join('|'));
        if (names.length > 0) {
            url += '&names=' + encodeURIComponent(names.join('|'));
        }
        if (closed.some(function (c) { return c === '1'; })) {
            url += '&closed=' + encodeURIComponent(closed.join(','));
        }
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(function () {
                md.showSuccess('Share URL copied to clipboard!');
            });
        } else {
            prompt('Copy this URL to share:', url);
        }
    }

    function loadFromHash() {
        var hash = window.location.hash;
        if (!hash) return;

        if (hash.indexOf('#pins=') === 0) {
            try {
                var data = decodeURIComponent(hash.substring(6));
                data.split(';').forEach(function (pair) {
                    var parts = pair.split(',');
                    if (parts.length === 2) {
                        var lat = parseFloat(parts[0]), lon = parseFloat(parts[1]);
                        if (!isNaN(lat) && !isNaN(lon)) md.addPin(lat, lon);
                    }
                });
                if (md.paths[0].pins.length > 0) md.map.setCamera({ center: [md.paths[0].pins[0].lon, md.paths[0].pins[0].lat], zoom: md.DEFAULT_ZOOM });
            } catch (e) { /* ignore bad hash */ }
            return;
        }

        if (hash.indexOf('#paths=') === 0) {
            try {
                var fullHash = hash.substring(1);
                var params = {};
                fullHash.split('&').forEach(function (part) {
                    var eq = part.indexOf('=');
                    if (eq > -1) params[part.substring(0, eq)] = decodeURIComponent(part.substring(eq + 1));
                });
                var pathNames = params.names ? params.names.split('|') : [];
                var closedFlags = params.closed ? params.closed.split(',') : [];
                var pathStrings = (params.paths || '').split('|');
                for (var pi = 0; pi < pathStrings.length; pi++) {
                    if (pi > 0) {
                        var np = md.createPathObj(md.paths.length);
                        md.paths.push(np);
                        md.initPathSources(np);
                    }
                    if (pathNames[pi]) md.paths[pi].name = pathNames[pi];
                    md.currentPathIndex = pi;
                    pathStrings[pi].split(';').forEach(function (pair) {
                        var parts = pair.split(',');
                        if (parts.length === 2) {
                            var lat = parseFloat(parts[0]), lon = parseFloat(parts[1]);
                            if (!isNaN(lat) && !isNaN(lon)) md.addPin(lat, lon);
                        }
                    });
                }
                // Restore closed shapes
                for (var ci = 0; ci < closedFlags.length; ci++) {
                    if (closedFlags[ci] === '1' && md.paths[ci] && md.paths[ci].pins.length >= 3) {
                        md.currentPathIndex = ci;
                        window.closeShape();
                    }
                }
                md.setActivePath(md.paths.length - 1);
                md.refreshActivePathUi();
                if (md.paths[0].pins.length > 0) md.map.setCamera({ center: [md.paths[0].pins[0].lon, md.paths[0].pins[0].lat], zoom: md.DEFAULT_ZOOM });
            } catch (e) { /* ignore bad hash */ }
        }
    }

    window.shareUrl = shareUrl;
    md.loadFromHash = loadFromHash;
})(MapDistance);
