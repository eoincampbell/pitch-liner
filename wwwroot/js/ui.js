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

    function mapZoom(delta) {
        md.map.setCamera({ zoom: md.map.getCamera().zoom + delta });
    }

    function resetView() {
        md.map.setCamera({ center: md.DEFAULT_CENTER, zoom: md.DEFAULT_ZOOM });
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

    window.showError = showError;
    window.showSuccess = showSuccess;
    window.showHelp = showHelp;
    window.closeHelp = closeHelp;
    window.mapZoom = mapZoom;
    window.resetView = resetView;
    window.toggleStyle = toggleStyle;
    window.togglePanel = togglePanel;

    md.showError = showError;
    md.showSuccess = showSuccess;
})(MapDistance);
