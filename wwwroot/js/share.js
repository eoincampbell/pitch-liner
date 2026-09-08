/**
 * MapDistance – Share via URL and load from URL hash.
 * Uses deflate compression + base64url encoding for compact URLs.
 * Maintains backwards compatibility with legacy #pins= and #paths= formats.
 */
(function (md) {
    'use strict';

    // --- Compression utilities ---

    function uint8ToBase64Url(bytes) {
        var binary = '';
        for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function base64UrlToUint8(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        var binary = atob(str);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function compress(jsonStr) {
        var input = new TextEncoder().encode(jsonStr);
        var cs = new CompressionStream('deflate-raw');
        var writer = cs.writable.getWriter();
        writer.write(input);
        writer.close();
        return new Response(cs.readable).arrayBuffer().then(function (buf) {
            return uint8ToBase64Url(new Uint8Array(buf));
        });
    }

    function decompress(base64Str) {
        var bytes = base64UrlToUint8(base64Str);
        var ds = new DecompressionStream('deflate-raw');
        var writer = ds.writable.getWriter();
        writer.write(bytes);
        writer.close();
        return new Response(ds.readable).text();
    }

    // --- Share (encode) ---

    function shareUrl() {
        var hasData = md.paths.some(function (p) { return p.pins.length > 0; });
        if (!hasData) { md.showError('No pins to share.'); return; }

        // Build compact data object
        var cam = md.map.getCamera();
        var payload = {
            l: md.currentLocationId,
            v: [
                +cam.center[0].toFixed(6),
                +cam.center[1].toFixed(6),
                +cam.zoom.toFixed(2),
                +(cam.bearing || 0).toFixed(1),
                +(cam.pitch || 0).toFixed(1)
            ],
            p: []
        };

        for (var pi = 0; pi < md.paths.length; pi++) {
            if (md.paths[pi].pins.length === 0) continue;
            var pathData = {
                c: md.paths[pi].pins.map(function (pin) { return [+pin.lat.toFixed(6), +pin.lon.toFixed(6)]; })
            };
            if (md.paths[pi].name !== 'Path ' + (pi + 1)) pathData.n = md.paths[pi].name;
            if (md.paths[pi].shapeClosed) pathData.s = 1;
            payload.p.push(pathData);
        }

        var json = JSON.stringify(payload);
        compress(json).then(function (encoded) {
            var url = window.location.origin + window.location.pathname + '#d=' + encoded;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(function () {
                    md.showSuccess('Share URL copied to clipboard!');
                });
            } else {
                prompt('Copy this URL to share:', url);
            }
        });
    }

    // --- Load (decode) ---

    function loadFromHash() {
        var hash = window.location.hash;
        if (!hash) return;

        // New compressed format: #d=...
        if (hash.indexOf('#d=') === 0) {
            var encoded = hash.substring(3);
            decompress(encoded).then(function (json) {
                try {
                    var data = JSON.parse(json);
                    restoreFromPayload(data);
                } catch (e) { /* ignore bad data */ }
            }).catch(function () { /* ignore decompression errors */ });
            return;
        }

        // Legacy: #pins=
        if (hash.indexOf('#pins=') === 0) {
            try {
                var pinData = decodeURIComponent(hash.substring(6));
                pinData.split(';').forEach(function (pair) {
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

        // Legacy: #paths=
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
                for (var ci = 0; ci < closedFlags.length; ci++) {
                    if (closedFlags[ci] === '1' && md.paths[ci] && md.paths[ci].pins.length >= 3) {
                        md.currentPathIndex = ci;
                        window.closeShape();
                    }
                }
                md.setActivePath(md.paths.length - 1);
                md.refreshActivePathUi();
                if (params.view) {
                    var vp = params.view.split(',');
                    if (vp.length >= 3) {
                        var camOpts = { center: [parseFloat(vp[0]), parseFloat(vp[1])], zoom: parseFloat(vp[2]) };
                        if (vp.length >= 4) camOpts.bearing = parseFloat(vp[3]);
                        if (vp.length >= 5) camOpts.pitch = parseFloat(vp[4]);
                        md.map.setCamera(camOpts);
                    }
                } else if (md.paths[0].pins.length > 0) {
                    md.map.setCamera({ center: [md.paths[0].pins[0].lon, md.paths[0].pins[0].lat], zoom: md.DEFAULT_ZOOM });
                }
            } catch (e) { /* ignore bad hash */ }
        }
    }

    function restoreFromPayload(data) {
        if (!data || !data.p || !data.p.length) return;

        md.applyLocation(data.l || md.DEFAULT_LOCATION_ID, { skipCamera: true });

        for (var pi = 0; pi < data.p.length; pi++) {
            var pathData = data.p[pi];
            if (pi > 0) {
                var np = md.createPathObj(md.paths.length);
                md.paths.push(np);
                md.initPathSources(np);
            }
            if (pathData.n) md.paths[pi].name = pathData.n;
            md.currentPathIndex = pi;
            for (var i = 0; i < pathData.c.length; i++) {
                md.addPin(pathData.c[i][0], pathData.c[i][1]);
            }
        }

        // Restore closed shapes
        for (var ci = 0; ci < data.p.length; ci++) {
            if (data.p[ci].s && md.paths[ci] && md.paths[ci].pins.length >= 3) {
                md.currentPathIndex = ci;
                window.closeShape();
            }
        }

        md.setActivePath(md.paths.length - 1);
        md.refreshActivePathUi();

        // Restore camera
        if (data.v && data.v.length >= 3) {
            var camOpts = { center: [data.v[0], data.v[1]], zoom: data.v[2] };
            if (data.v.length >= 4) camOpts.bearing = data.v[3];
            if (data.v.length >= 5) camOpts.pitch = data.v[4];
            md.map.setCamera(camOpts);
        } else if (md.paths[0].pins.length > 0) {
            md.map.setCamera({ center: [md.paths[0].pins[0].lon, md.paths[0].pins[0].lat], zoom: md.activeZoom() });
        }
    }

    window.shareUrl = shareUrl;
    md.loadFromHash = loadFromHash;
})(MapDistance);
