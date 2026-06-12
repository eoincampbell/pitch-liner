/**
 * MapDistance – Close shape and area calculation.
 */
(function (md) {
    'use strict';

    function closeShape() {
        var path = md.curPath();
        if (path.pins.length < 3) {
            md.showError('At least 3 pins are needed to close a shape.');
            return;
        }
        path.shapeClosed = true;
        var first = path.pins[0], last = path.pins[path.pins.length - 1];
        path.closingLineSource.clear();
        path.closingLineSource.add(new atlas.data.Feature(
            new atlas.data.LineString([[last.lon, last.lat], [first.lon, first.lat]])
        ));

        // Add semi-transparent polygon fill
        var ring = path.pins.map(function (p) { return [p.lon, p.lat]; });
        ring.push(ring[0]); // close the ring
        path.fillSource.clear();
        path.fillSource.add(new atlas.data.Feature(
            new atlas.data.Polygon([ring])
        ));

        // Add path name label at centroid
        updateShapeLabel(path);

        updateAreaDisplay();
    }

    function updateShapeLabel(path) {
        if (!path.shapeClosed || path.pins.length < 3) {
            path.shapeLabelSource.clear();
            return;
        }
        var sumLon = 0, sumLat = 0;
        for (var i = 0; i < path.pins.length; i++) {
            sumLon += path.pins[i].lon;
            sumLat += path.pins[i].lat;
        }
        var centroid = [sumLon / path.pins.length, sumLat / path.pins.length];
        path.shapeLabelSource.clear();
        path.shapeLabelSource.add(new atlas.data.Feature(
            new atlas.data.Point(centroid),
            { label: path.name }
        ));
    }

    function updateAreaDisplay() {
        var path = md.curPath();
        if (!path || !path.shapeClosed || path.pins.length < 3) {
            document.getElementById('area-info').style.display = 'none';
            return;
        }

        var areaM2 = calculateArea(path);
        var areaInfo = document.getElementById('area-info');
        var areaStr;
        if (md.currentUnit === 'km') areaStr = (areaM2 / 1e6).toFixed(4) + ' km\u00B2';
        else if (md.currentUnit === 'mi') areaStr = (areaM2 / 2.59e6).toFixed(4) + ' mi\u00B2';
        else if (md.currentUnit === 'yd') areaStr = (areaM2 * 1.19599).toFixed(0) + ' yd\u00B2';
        else areaStr = Math.round(areaM2) + ' m\u00B2';

        var closingDist = atlas.math.getDistanceTo(
            new atlas.data.Position(path.pins[path.pins.length - 1].lon, path.pins[path.pins.length - 1].lat),
            new atlas.data.Position(path.pins[0].lon, path.pins[0].lat)
        );

        areaInfo.textContent = '';
        var areaLine = document.createElement('div');
        areaLine.innerHTML = path.name + ' Area: <strong>' + areaStr + '</strong>';
        var distLine = document.createElement('div');
        distLine.innerHTML = 'Closing Distance: <strong>' + md.formatDist(closingDist) + '</strong>';
        areaInfo.appendChild(areaLine);
        areaInfo.appendChild(distLine);
        areaInfo.style.display = 'block';
    }

    function lonLatToMercatorPixel(lon, lat, zoom) {
        var scale = 256 * Math.pow(2, zoom);
        var x = (lon + 180) / 360 * scale;
        var latRad = lat * Math.PI / 180;
        var y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale;
        return [x, y];
    }

    function calculateArea(path) {
        var coords = path.pins.map(function (p) {
            return lonLatToMercatorPixel(p.lon, p.lat, 20);
        });
        var n = coords.length, area = 0;
        for (var i = 0; i < n; i++) {
            var j = (i + 1) % n;
            area += coords[i][0] * coords[j][1];
            area -= coords[j][0] * coords[i][1];
        }
        area = Math.abs(area) / 2;
        var lat = path.pins[0].lat * Math.PI / 180;
        var metersPerPixel = 156543.03392 * Math.cos(lat) / Math.pow(2, 20);
        return area * metersPerPixel * metersPerPixel;
    }

    window.closeShape = closeShape;
    window.updateAreaDisplay = updateAreaDisplay;
    md.updateShapeLabel = updateShapeLabel;
})(MapDistance);
