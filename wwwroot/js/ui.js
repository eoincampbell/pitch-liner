/**
 * MapDistance – Toast and modal UI helpers, map controls.
 */
(function (md) {
    'use strict';

    function showError(msg) {
        var t = document.getElementById('error-toast');
        t.textContent = msg;
        t.style.display = 'block';
        setTimeout(function () { t.style.display = 'none'; }, 6000);
    }

    function showSuccess(msg) {
        var t = document.getElementById('success-toast');
        t.textContent = msg;
        t.style.display = 'block';
        setTimeout(function () { t.style.display = 'none'; }, 4000);
    }

    function showHelp() { document.getElementById('help-modal').classList.add('active'); }
    function closeHelp() { document.getElementById('help-modal').classList.remove('active'); }

    var colorPickerPathIndex = -1;

    function closeColorPicker() {
        colorPickerPathIndex = -1;
        document.getElementById('color-picker-modal').classList.remove('active');
    }

    function openColorPicker(pathIndex) {
        var path = md.paths[pathIndex];
        if (!path) return;

        colorPickerPathIndex = pathIndex;
        document.getElementById('color-picker-path-name').textContent = 'Choose a colour for ' + path.name + '.';

        var grid = document.getElementById('color-swatch-grid');
        grid.innerHTML = '';

        md.PATH_COLORS.forEach(function (c, i) {
            var swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'color-swatch' + (i === path.colorIndex ? ' selected' : '');
            swatch.style.background = c.hex;
            swatch.title = c.name;
            swatch.setAttribute('aria-label', c.name);
            swatch.addEventListener('click', function () {
                md.setPathColor(colorPickerPathIndex, i);
                closeColorPicker();
            });
            grid.appendChild(swatch);
        });

        document.getElementById('color-picker-modal').classList.add('active');
    }

    document.getElementById('color-picker-modal').addEventListener('click', function (e) {
        if (e.target === this) closeColorPicker();
    });

    document.getElementById('help-modal').addEventListener('click', function (e) {
        if (e.target === this) closeHelp();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeColorPicker();
            closeHelp();
        }
    });

    function mapZoom(delta) {
        md.map.setCamera({ zoom: md.map.getCamera().zoom + delta });
    }

    function resetView() {
        md.map.setCamera({ center: md.activeCenter(), zoom: md.activeZoom() });
        md.map.setStyle({ style: md.DEFAULT_STYLE });
    }

    function toggleStyle() {
        var current = md.map.getStyle().style;
        md.map.setStyle({ style: current === 'satellite_road_labels' ? 'road' : 'satellite_road_labels' });
    }

    function togglePanel() {
        var panel = document.getElementById('stats-panel');
        var btn = document.getElementById('panel-toggle');
        var isHidden = panel.classList.toggle('hidden');
        btn.classList.toggle('shifted', isHidden);
        btn.innerHTML = isHidden ? '&#x25B6;' : '&#x25C0;';
        btn.title = isHidden ? 'Show stats panel' : 'Hide stats panel';
    }

    // Debug overlay - opt in with the ?debug=1 query string. Never saved or shared.
    var debugFlag = new URLSearchParams(window.location.search).get('debug');
    var debugEnabled = debugFlag !== null && debugFlag !== '0' && debugFlag.toLowerCase() !== 'false';

    function updateDebugBox() {
        if (!debugEnabled || !md.map) return;
        var cam = md.map.getCamera();
        document.getElementById('debug-lat').textContent = cam.center[1].toFixed(6);
        document.getElementById('debug-lng').textContent = cam.center[0].toFixed(6);
        document.getElementById('debug-zoom').textContent = cam.zoom.toFixed(2);
        document.getElementById('debug-bearing').textContent = (cam.bearing || 0).toFixed(1) + '\u00B0';
        document.getElementById('debug-pitch').textContent = (cam.pitch || 0).toFixed(1) + '\u00B0';
    }

    function showDebugBox() {
        document.getElementById('debug-box').style.display = 'block';
    }

    window.showError = showError;
    window.showSuccess = showSuccess;
    window.showHelp = showHelp;
    window.closeHelp = closeHelp;
    window.openColorPicker = openColorPicker;
    window.closeColorPicker = closeColorPicker;
    window.mapZoom = mapZoom;
    window.resetView = resetView;
    window.toggleStyle = toggleStyle;
    window.togglePanel = togglePanel;

    md.showError = showError;
    md.showSuccess = showSuccess;
    md.openColorPicker = openColorPicker;
    md.closeColorPicker = closeColorPicker;
    md.debugEnabled = debugEnabled;
    md.updateDebugBox = updateDebugBox;
    md.showDebugBox = showDebugBox;
})(MapDistance);
