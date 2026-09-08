/**
 * MapDistance – Venue location selection.
 * Populates the location dropdown, switches the map between venues, and
 * prompts before discarding existing pins/paths.
 */
(function (md) {
    'use strict';

    var pendingLocationId = null;

    function populateLocationSelect() {
        var select = document.getElementById('location-select');
        if (!select) return;
        select.innerHTML = '';
        for (var i = 0; i < md.LOCATIONS.length; i++) {
            var loc = md.LOCATIONS[i];
            var opt = document.createElement('option');
            opt.value = loc.id;
            opt.textContent = loc.name;
            select.appendChild(opt);
        }
        select.value = md.currentLocationId;
    }

    function hasMapData() {
        return md.paths.some(function (p) { return p.pins.length > 0; });
    }

    function syncSelect() {
        var select = document.getElementById('location-select');
        if (select) select.value = md.currentLocationId;
    }

    function applyLocation(id, opts) {
        var loc = md.getLocation(id);
        if (!loc) return;
        md.currentLocationId = loc.id;
        syncSelect();
        if (!(opts && opts.skipCamera) && md.map) {
            md.map.setCamera({ center: loc.center, zoom: loc.zoom });
        }
    }

    function openConfirm() {
        document.getElementById('location-confirm-modal').classList.add('active');
    }

    function closeConfirm() {
        document.getElementById('location-confirm-modal').classList.remove('active');
    }

    function changeLocation() {
        var select = document.getElementById('location-select');
        var newId = select.value;
        if (newId === md.currentLocationId) return;

        if (!hasMapData()) {
            applyLocation(newId);
            return;
        }

        pendingLocationId = newId;
        openConfirm();
    }

    function confirmLocationSwitch() {
        closeConfirm();
        if (!pendingLocationId) return;
        md.clearAll();
        applyLocation(pendingLocationId);
        pendingLocationId = null;
    }

    function cancelLocationSwitch() {
        closeConfirm();
        pendingLocationId = null;
        syncSelect();
    }

    document.addEventListener('DOMContentLoaded', function () {
        populateLocationSelect();
        var select = document.getElementById('location-select');
        if (select) select.addEventListener('change', changeLocation);
    });

    window.confirmLocationSwitch = confirmLocationSwitch;
    window.cancelLocationSwitch = cancelLocationSwitch;

    md.populateLocationSelect = populateLocationSelect;
    md.hasMapData = hasMapData;
    md.applyLocation = applyLocation;
})(MapDistance);
