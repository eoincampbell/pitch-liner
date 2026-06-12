/**
 * MapDistance – Stats table, labels, and unit formatting.
 */
(function (md) {
    'use strict';

    function formatDist(metres) {
        var cfg = md.UNIT_CONFIG[md.currentUnit];
        var val = metres * cfg.factor;
        if (md.currentUnit === 'km' || md.currentUnit === 'mi') return val.toFixed(3) + cfg.label;
        return Math.round(val) + cfg.label;
    }

    function updateTable() {
        var container = document.getElementById('stats-body');
        container.innerHTML = '';
        var grandTotal = 0;

        for (var pi = 0; pi < md.paths.length; pi++) {
            var path = md.paths[pi];
            var colors = md.getPathColor(path.colorIndex);

            if (pi > 0) {
                var sep = document.createElement('div');
                sep.className = 'path-separator';
                container.appendChild(sep);
            }

            var header = document.createElement('div');
            header.className = 'path-header';
            var dot = document.createElement('span');
            dot.className = 'color-dot';
            dot.style.background = colors.hex;
            header.appendChild(dot);

            var nameSpan = document.createElement('span');
            nameSpan.className = 'path-name-label';
            nameSpan.textContent = ' ' + path.name;
            nameSpan.title = 'Click to rename';
            (function (pathIndex) {
                nameSpan.addEventListener('click', function () {
                    var newName = prompt('Rename path:', md.paths[pathIndex].name);
                    if (newName && newName.trim()) {
                        md.paths[pathIndex].name = newName.trim();
                        if (md.paths[pathIndex].shapeClosed) {
                            md.updateShapeLabel(md.paths[pathIndex]);
                        }
                        md.updateTable();
                    }
                });
            })(pi);
            header.appendChild(nameSpan);

            var activeBtn = document.createElement('button');
            activeBtn.className = 'path-active-btn' + (pi === md.currentPathIndex ? ' active' : '');
            activeBtn.textContent = pi === md.currentPathIndex ? '● Active' : '○ Set Active';
            activeBtn.setAttribute('aria-label', 'Set ' + path.name + ' as active path');
            activeBtn.setAttribute('data-path-index', pi);
            activeBtn.addEventListener('click', (function (pathIndex) {
                return function (e) {
                    e.stopPropagation();
                    md.setActivePath(pathIndex);
                };
            })(pi));
            header.appendChild(activeBtn);
            if (pi === md.currentPathIndex) header.classList.add('path-header-active');

            container.appendChild(header);

            var tbl = document.createElement('table');
            var thead = document.createElement('thead');
            thead.innerHTML = '<tr><th>Pin #</th><th>Dist Prev</th><th>Total</th></tr>';
            tbl.appendChild(thead);

            var tbody = document.createElement('tbody');
            for (var i = 0; i < path.pins.length; i++) {
                var p = path.pins[i];
                var row = document.createElement('tr');
                var cells = [
                    (i + 1).toString(),
                    i === 0 ? 'N/A' : formatDist(p.distFromPrev),
                    formatDist(p.totalDistance)
                ];
                for (var c = 0; c < cells.length; c++) {
                    var td = document.createElement('td');
                    td.textContent = cells[c];
                    row.appendChild(td);
                }
                tbody.appendChild(row);
            }
            tbl.appendChild(tbody);
            container.appendChild(tbl);

            if (path.pins.length > 0) {
                var ptotal = document.createElement('div');
                ptotal.className = 'path-total';
                ptotal.style.color = colors.hex;
                ptotal.textContent = path.name + ' Total: ' + formatDist(path.totalDistance);
                container.appendChild(ptotal);
                grandTotal += path.totalDistance;
            }
        }

        var ot = document.getElementById('overall-total');
        if (md.paths.length > 1 || (md.paths.length === 1 && md.paths[0].pins.length > 0)) {
            ot.textContent = 'Overall Total: ' + formatDist(grandTotal);
            ot.style.display = 'block';
        } else {
            ot.style.display = 'none';
        }
    }

    function updateLabels() {
        md.labelSource.clear();
        var multiPath = md.paths.length > 1;
        for (var pi = 0; pi < md.paths.length; pi++) {
            var path = md.paths[pi];
            for (var i = 0; i < path.pins.length; i++) {
                var p = path.pins[i];
                var text = multiPath ? path.name + ': Pin ' + (i + 1) : 'Pin ' + (i + 1);
                if (i > 0) text += ' (' + formatDist(p.totalDistance) + ')';
                md.labelSource.add(new atlas.data.Feature(
                    new atlas.data.Point([p.lon, p.lat]),
                    { label: text }
                ));
            }
        }
    }

    function toggleLabels() {
        var visible = document.getElementById('show-labels').checked;
        md.map.layers.getLayerById('labelLayer').setOptions({ visible: visible });
    }

    function changeUnit() {
        md.currentUnit = document.getElementById('unit-select').value;
        updateTable();
        updateLabels();
        var cp = md.curPath();
        if (cp && cp.shapeClosed) window.updateAreaDisplay();
    }

    window.toggleLabels = toggleLabels;
    window.changeUnit = changeUnit;

    md.formatDist = formatDist;
    md.updateTable = updateTable;
    md.updateLabels = updateLabels;
})(MapDistance);
