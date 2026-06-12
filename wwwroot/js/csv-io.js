/**
 * MapDistance – CSV save and load with hardened validation.
 */
(function (md) {
    'use strict';

    function saveCsv() {
        var hasData = md.paths.some(function (p) { return p.pins.length > 0; });
        if (!hasData) return;
        var csv = 'Path,Path Name,Closed,Pin #,Lat,Long,Distance from Previous Pin,Total Distance\n';
        for (var pi = 0; pi < md.paths.length; pi++) {
            var path = md.paths[pi];
            for (var i = 0; i < path.pins.length; i++) {
                var p = path.pins[i];
                var safeName = '"' + path.name.replace(/"/g, '""') + '"';
                csv += (pi + 1) + ',' + safeName + ',' + (path.shapeClosed ? 'Yes' : 'No') + ',' + (i + 1) + ',' + p.lat.toFixed(6) + ',' + p.lon.toFixed(6) + ',' +
                    (i === 0 ? 'N/A' : Math.round(p.distFromPrev) + 'm') + ',' +
                    Math.round(p.totalDistance) + 'm\n';
            }
        }
        var blob = new Blob([csv], { type: 'text/csv' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pin_data.csv';
        a.click();
    }

    function loadCsv(event) {
        var file = event.target.files[0];
        if (!file) return;

        if (file.size > md.MAX_CSV_SIZE) {
            md.showError('File is too large. Maximum size is 1 MB.');
            event.target.value = '';
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var lines = e.target.result.trim().split('\n');
                if (lines.length < 2) throw new Error('CSV file is empty or has no data rows.');
                if (lines.length - 1 > md.MAX_CSV_ROWS) {
                    throw new Error('CSV file has too many rows. Maximum is ' + md.MAX_CSV_ROWS + '.');
                }

                var header = lines[0].toLowerCase();
                var hasPathCol = header.indexOf('path') !== -1;
                var hasNameCol = header.indexOf('path name') !== -1;
                var hasClosedCol = header.indexOf('closed') !== -1;
                if (header.indexOf('lat') === -1 || header.indexOf('long') === -1) {
                    throw new Error('CSV header must contain "Lat" and "Long" columns.');
                }

                md.clearAll();

                for (var i = 1; i < lines.length; i++) {
                    // Handle quoted fields (path names may contain commas)
                    var cols = [];
                    var line = lines[i];
                    var inQuote = false;
                    var field = '';
                    for (var ch = 0; ch < line.length; ch++) {
                        if (line[ch] === '"') { inQuote = !inQuote; }
                        else if (line[ch] === ',' && !inQuote) { cols.push(field); field = ''; }
                        else { field += line[ch]; }
                    }
                    cols.push(field);

                    var lat, lon, pathNum, pathName, closedVal;
                    if (hasNameCol && hasClosedCol) {
                        if (cols.length < 6) throw new Error('Row ' + i + ' does not have enough columns.');
                        pathNum = parseInt(cols[0]) || 1;
                        pathName = cols[1] || '';
                        closedVal = cols[2] || '';
                        lat = parseFloat(cols[4]);
                        lon = parseFloat(cols[5]);
                    } else if (hasNameCol) {
                        if (cols.length < 5) throw new Error('Row ' + i + ' does not have enough columns.');
                        pathNum = parseInt(cols[0]) || 1;
                        pathName = cols[1] || '';
                        closedVal = '';
                        lat = parseFloat(cols[3]);
                        lon = parseFloat(cols[4]);
                    } else if (hasPathCol) {
                        if (cols.length < 4) throw new Error('Row ' + i + ' does not have enough columns.');
                        pathNum = parseInt(cols[0]) || 1;
                        pathName = '';
                        closedVal = '';
                        lat = parseFloat(cols[2]);
                        lon = parseFloat(cols[3]);
                    } else {
                        if (cols.length < 3) throw new Error('Row ' + i + ' does not have enough columns.');
                        pathNum = 1;
                        pathName = '';
                        closedVal = '';
                        lat = parseFloat(cols[1]);
                        lon = parseFloat(cols[2]);
                    }
                    if (isNaN(lat) || isNaN(lon)) throw new Error('Row ' + i + ' has invalid Lat/Long values.');

                    while (pathNum > md.paths.length) {
                        var np = md.createPathObj(md.paths.length);
                        md.paths.push(np);
                        md.initPathSources(np);
                    }
                    if (pathName) {
                        md.paths[pathNum - 1].name = pathName;
                    }
                    if (closedVal.toLowerCase() === 'yes') {
                        md.paths[pathNum - 1]._shouldClose = true;
                    }
                    md.currentPathIndex = pathNum - 1;
                    md.addPin(lat, lon);
                }
                // Restore closed shapes
                for (var ci = 0; ci < md.paths.length; ci++) {
                    if (md.paths[ci]._shouldClose && md.paths[ci].pins.length >= 3) {
                        md.currentPathIndex = ci;
                        window.closeShape();
                        delete md.paths[ci]._shouldClose;
                    }
                }
                md.setActivePath(md.paths.length - 1);
                md.refreshActivePathUi();

                var firstPin = md.paths[0].pins[0];
                if (firstPin) {
                    md.map.setCamera({ center: [firstPin.lon, firstPin.lat], zoom: md.DEFAULT_ZOOM });
                }
            } catch (err) {
                md.showError('Load failed: ' + err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    window.saveCsv = saveCsv;
    window.loadCsv = loadCsv;
})(MapDistance);
