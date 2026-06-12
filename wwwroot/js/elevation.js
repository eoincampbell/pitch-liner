/**
 * MapDistance – Elevation profile fetching (via server proxy) and chart rendering.
 */
(function (md) {
    'use strict';

    function fetchElevation(lat, lon) {
        var pathIdx = md.currentPathIndex;
        fetch('/api/maps/elevation?points=' + encodeURIComponent(lon + ',' + lat))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.data && data.data.length > 0) {
                    md.paths[pathIdx].elevations.push(data.data[0].elevationInMeter);
                } else {
                    md.paths[pathIdx].elevations.push(null);
                }
                if (pathIdx === md.currentPathIndex) drawElevationChart();
            })
            .catch(function () {
                md.paths[pathIdx].elevations.push(null);
                if (pathIdx === md.currentPathIndex) drawElevationChart();
            });
    }

    function drawElevationChart() {
        var panel = document.getElementById('elevation-panel');
        var canvas = document.getElementById('elevation-canvas');
        var elevations = md.curPath().elevations;
        var valid = elevations.filter(function (e) { return e !== null; });
        if (valid.length < 2) { panel.style.display = 'none'; return; }
        panel.style.display = 'block';

        var ctx = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        var pad = 30;
        ctx.clearRect(0, 0, w, h);

        var minE = Math.min.apply(null, valid);
        var maxE = Math.max.apply(null, valid);
        var range = maxE - minE || 1;

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(pad, 5); ctx.lineTo(pad, h - 15); ctx.lineTo(w - 5, h - 15);
        ctx.stroke();

        ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
        ctx.fillText(Math.round(maxE) + 'm', 0, 12);
        ctx.fillText(Math.round(minE) + 'm', 0, h - 16);

        var colors = md.getPathColor(md.curPath().colorIndex);
        ctx.strokeStyle = colors.line; ctx.lineWidth = 2;
        ctx.beginPath();
        var step = (w - pad - 5) / (elevations.length - 1);
        for (var i = 0; i < elevations.length; i++) {
            var elev = elevations[i] !== null ? elevations[i] : minE;
            var x = pad + i * step;
            var y = (h - 20) - ((elev - minE) / range) * (h - 30);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = colors.line;
        for (var j = 0; j < elevations.length; j++) {
            if (elevations[j] === null) continue;
            var dx = pad + j * step;
            var dy = (h - 20) - ((elevations[j] - minE) / range) * (h - 30);
            ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2); ctx.fill();
        }
    }

    md.fetchElevation = fetchElevation;
    md.drawElevationChart = drawElevationChart;
})(MapDistance);
