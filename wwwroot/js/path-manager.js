/**
 * MapDistance – Path management (create, add pin, undo, clear).
 * Tracks Azure Maps layer IDs per path for proper cleanup.
 */
(function (md) {
    'use strict';

    function createPathObj(index) {
        return {
            name: 'Path ' + (index + 1),
            pins: [],
            totalDistance: 0,
            shapeClosed: false,
            elevations: [],
            pinSource: null,
            lineSource: null,
            closingLineSource: null,
            fillSource: null,
            shapeLabelSource: null,
            layerIds: [],
            colorIndex: index
        };
    }

    function initPathSources(path) {
        var colors = md.getPathColor(path.colorIndex);
        path.pinSource = new atlas.source.DataSource();
        path.lineSource = new atlas.source.DataSource();
        path.closingLineSource = new atlas.source.DataSource();
        path.fillSource = new atlas.source.DataSource();
        path.shapeLabelSource = new atlas.source.DataSource();
        md.map.sources.add(path.pinSource);
        md.map.sources.add(path.lineSource);
        md.map.sources.add(path.closingLineSource);
        md.map.sources.add(path.fillSource);
        md.map.sources.add(path.shapeLabelSource);

        var fillLayer = new atlas.layer.PolygonLayer(path.fillSource, null, {
            fillColor: colors.hex,
            fillOpacity: 0.25
        });
        var lineLayer = new atlas.layer.LineLayer(path.lineSource, null, {
            strokeColor: colors.line, strokeWidth: 2, strokeDashArray: [4, 4]
        });
        var closingLayer = new atlas.layer.LineLayer(path.closingLineSource, null, {
            strokeColor: colors.line, strokeWidth: 2, strokeDashArray: [2, 6], strokeOpacity: 0.6
        });
        var symbolLayer = new atlas.layer.SymbolLayer(path.pinSource, null, {
            iconOptions: { image: colors.pin, size: 0.7, anchor: 'bottom', allowOverlap: true }
        });
        var shapeLabelLayer = new atlas.layer.SymbolLayer(path.shapeLabelSource, null, {
            iconOptions: { image: 'none' },
            textOptions: {
                textField: ['get', 'label'],
                offset: [0, 0],
                color: '#ffffff',
                haloColor: colors.hex,
                haloWidth: 2,
                size: 14,
                font: ['StandardFont-Bold'],
                allowOverlap: true
            }
        });

        md.map.layers.add(fillLayer);
        md.map.layers.add(lineLayer);
        md.map.layers.add(closingLayer);
        md.map.layers.add(symbolLayer);
        md.map.layers.add(shapeLabelLayer);

        // Keep label layer on top so labels are visible for all paths
        var labelLayer = md.map.layers.getLayerById('labelLayer');
        if (labelLayer) md.map.layers.move(labelLayer);

        path.layerIds = [fillLayer.getId(), lineLayer.getId(), closingLayer.getId(), symbolLayer.getId(), shapeLabelLayer.getId()];
    }

    function refreshActivePathUi() {
        var path = md.curPath();
        var areaInfo = document.getElementById('area-info');

        md.updateTable();
        if (path && path.shapeClosed) {
            window.updateAreaDisplay();
        } else {
            areaInfo.style.display = 'none';
            areaInfo.textContent = '';
        }
        md.drawElevationChart();
    }

    function setActivePath(pathIndex) {
        if (pathIndex < 0 || pathIndex >= md.paths.length) {
            return;
        }

        md.currentPathIndex = pathIndex;
        refreshActivePathUi();
    }

    function newPath() {
        if (md.curPath().pins.length === 0) return;
        var p = createPathObj(md.paths.length);
        md.paths.push(p);
        initPathSources(p);
        setActivePath(md.paths.length - 1);
    }

    function addPin(lat, lon) {
        var path = md.curPath();
        if (path.shapeClosed) {
            path.shapeClosed = false;
            path.closingLineSource.clear();
            path.fillSource.clear();
            path.shapeLabelSource.clear();
            document.getElementById('area-info').style.display = 'none';
        }

        path.pinSource.add(new atlas.data.Feature(new atlas.data.Point([lon, lat])));

        var distFromPrev = 0;
        if (path.pins.length > 0) {
            var prev = path.pins[path.pins.length - 1];
            distFromPrev = atlas.math.getDistanceTo(
                new atlas.data.Position(prev.lon, prev.lat),
                new atlas.data.Position(lon, lat)
            );
            path.lineSource.add(new atlas.data.Feature(
                new atlas.data.LineString([[prev.lon, prev.lat], [lon, lat]])
            ));
        }
        path.totalDistance += distFromPrev;
        path.pins.push({ lat: lat, lon: lon, distFromPrev: distFromPrev, totalDistance: path.totalDistance });

        md.updateLabels();
        md.updateTable();
        md.fetchElevation(lat, lon);
    }

    function undoLastPin() {
        var path = md.curPath();
        if (path.pins.length === 0) return;
        if (path.shapeClosed) {
            path.shapeClosed = false;
            path.closingLineSource.clear();
            path.fillSource.clear();
            path.shapeLabelSource.clear();
            document.getElementById('area-info').style.display = 'none';
        }
        var removed = path.pins.pop();
        path.totalDistance -= removed.distFromPrev;
        path.elevations.pop();

        path.pinSource.clear();
        path.lineSource.clear();
        for (var i = 0; i < path.pins.length; i++) {
            var p = path.pins[i];
            path.pinSource.add(new atlas.data.Feature(new atlas.data.Point([p.lon, p.lat])));
            if (i > 0) {
                var prev = path.pins[i - 1];
                path.lineSource.add(new atlas.data.Feature(
                    new atlas.data.LineString([[prev.lon, prev.lat], [p.lon, p.lat]])
                ));
            }
        }
        md.updateLabels();
        md.updateTable();
        md.drawElevationChart();
    }

    function clearAll() {
        for (var i = 1; i < md.paths.length; i++) {
            var p = md.paths[i];
            for (var j = 0; j < p.layerIds.length; j++) {
                var layer = md.map.layers.getLayerById(p.layerIds[j]);
                if (layer) md.map.layers.remove(layer);
            }
            md.map.sources.remove(p.pinSource);
            md.map.sources.remove(p.lineSource);
            md.map.sources.remove(p.closingLineSource);
            md.map.sources.remove(p.fillSource);
            md.map.sources.remove(p.shapeLabelSource);
        }

        var firstPath = md.paths[0];
        firstPath.pinSource.clear();
        firstPath.lineSource.clear();
        firstPath.closingLineSource.clear();
        firstPath.fillSource.clear();
        firstPath.shapeLabelSource.clear();
        firstPath.pins = [];
        firstPath.totalDistance = 0;
        firstPath.shapeClosed = false;
        firstPath.elevations = [];

        md.labelSource.clear();
        md.paths = [firstPath];
        md.currentPathIndex = 0;

        document.getElementById('stats-body').innerHTML = '';
        document.getElementById('area-info').style.display = 'none';
        document.getElementById('overall-total').style.display = 'none';
        document.getElementById('elevation-panel').style.display = 'none';

        refreshActivePathUi();
    }

    window.newPath = newPath;
    window.undoLastPin = undoLastPin;
    window.clearAll = clearAll;
    window.setActivePath = setActivePath;

    md.createPathObj = createPathObj;
    md.initPathSources = initPathSources;
    md.addPin = addPin;
    md.clearAll = clearAll;
    md.refreshActivePathUi = refreshActivePathUi;
    md.setActivePath = setActivePath;
})(MapDistance);
