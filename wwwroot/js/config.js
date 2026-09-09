/**
 * MapDistance – Application namespace and shared state.
 */
var MapDistance = (function () {
    'use strict';

    // Configurable venue list. Add or amend entries here to change the
    // locations offered in the location dropdown. Centres are [lon, lat].
    var LOCATIONS = [
        { id: 'ellenfield',  name: 'Ellenfield Park',   center: [-6.241326, 53.385993], zoom: 17.8 },
        { id: 'collins-ave', name: 'Collins Ave Pitch', center: [-6.242586, 53.380940], zoom: 18.2 },
        { id: 'cloghran',    name: 'Cloghran Pitch',    center: [-6.240856, 53.412952], zoom: 18.6 },
        { id: 'lorcan',      name: 'Lorcan Green',      center: [-6.231238, 53.393000], zoom: 18.6 },
        { id: 'belcamp',     name: 'Belcamp Park',      center: [-6.212949, 53.407752], zoom: 17.2 },
        { id: 'st-aidans',   name: 'St. Aidans',        center: [-6.252029, 53.383344], zoom: 18.2 }
    ];

    var DEFAULT_LOCATION_ID = 'ellenfield';

    function findLocation(id) {
        for (var i = 0; i < LOCATIONS.length; i++) {
            if (LOCATIONS[i].id === id) return LOCATIONS[i];
        }
        return null;
    }

    var DEFAULT_LOCATION = findLocation(DEFAULT_LOCATION_ID) || LOCATIONS[0];

    var DEFAULT_CENTER = DEFAULT_LOCATION.center;
    var DEFAULT_ZOOM = DEFAULT_LOCATION.zoom;
    var DEFAULT_STYLE = 'satellite_road_labels';

    // Path colour palette. Each entry drives the line stroke, the polygon fill,
    // the shape label halo and a custom SVG marker pin registered at map startup.
    // 'pin' must match the sprite id created in map-init.js ('pin-' + index).
    var PATH_COLORS = [
        { name: 'Red',     line: '#e6194b', pin: 'pin-0',  hex: '#e6194b' },
        { name: 'Blue',    line: '#1e90ff', pin: 'pin-1',  hex: '#1e90ff' },
        { name: 'Green',   line: '#3cb44b', pin: 'pin-2',  hex: '#3cb44b' },
        { name: 'Orange',  line: '#ff8c00', pin: 'pin-3',  hex: '#ff8c00' },
        { name: 'Purple',  line: '#911eb4', pin: 'pin-4',  hex: '#911eb4' },
        { name: 'Cyan',    line: '#00ced1', pin: 'pin-5',  hex: '#00ced1' },
        { name: 'Magenta', line: '#f032e6', pin: 'pin-6',  hex: '#f032e6' },
        { name: 'Lime',    line: '#bfef45', pin: 'pin-7',  hex: '#bfef45' },
        { name: 'Teal',    line: '#008080', pin: 'pin-8',  hex: '#008080' },
        { name: 'Brown',   line: '#9a6324', pin: 'pin-9',  hex: '#9a6324' },
        { name: 'Navy',    line: '#4363d8', pin: 'pin-10', hex: '#4363d8' },
        { name: 'Olive',   line: '#808000', pin: 'pin-11', hex: '#808000' },
        { name: 'Coral',   line: '#fa8072', pin: 'pin-12', hex: '#fa8072' },
        { name: 'Gold',    line: '#ffd700', pin: 'pin-13', hex: '#ffd700' },
        { name: 'Violet',  line: '#8a2be2', pin: 'pin-14', hex: '#8a2be2' },
        { name: 'Slate',   line: '#708090', pin: 'pin-15', hex: '#708090' }
    ];

    // Opacity applied to the polygon fill of a closed shape.
    var FILL_OPACITY = 0.25;

    // Secondary (outline) colour used when generating the custom SVG marker pins.
    var PIN_OUTLINE_COLOR = '#ffffff';

    var UNIT_CONFIG = {
        m:  { label: 'm',  factor: 1 },
        yd: { label: 'yd', factor: 1.09361 },
        km: { label: 'km', factor: 0.001 },
        mi: { label: 'mi', factor: 0.000621371 }
    };

    var MAX_CSV_SIZE = 1048576;
    var MAX_CSV_ROWS = 10000;

    return {
        LOCATIONS: LOCATIONS,
        DEFAULT_LOCATION_ID: DEFAULT_LOCATION_ID,
        DEFAULT_CENTER: DEFAULT_CENTER,
        DEFAULT_ZOOM: DEFAULT_ZOOM,
        DEFAULT_STYLE: DEFAULT_STYLE,
        PATH_COLORS: PATH_COLORS,
        FILL_OPACITY: FILL_OPACITY,
        PIN_OUTLINE_COLOR: PIN_OUTLINE_COLOR,
        UNIT_CONFIG: UNIT_CONFIG,
        MAX_CSV_SIZE: MAX_CSV_SIZE,
        MAX_CSV_ROWS: MAX_CSV_ROWS,

        map: null,
        labelSource: null,
        paths: [],
        currentPathIndex: 0,
        currentUnit: 'm',
        currentLocationId: DEFAULT_LOCATION_ID,
        labelMode: 'off',

        getPathColor: function (index) {
            return PATH_COLORS[index % PATH_COLORS.length];
        },
        getPathColorIndexByHex: function (hex) {
            if (!hex) return -1;
            var target = String(hex).trim().toLowerCase();
            for (var i = 0; i < PATH_COLORS.length; i++) {
                if (PATH_COLORS[i].hex.toLowerCase() === target) return i;
            }
            return -1;
        },
        curPath: function () {
            return this.paths[this.currentPathIndex];
        },
        getLocation: function (id) {
            return findLocation(id);
        },
        getCurrentLocation: function () {
            return findLocation(this.currentLocationId) || DEFAULT_LOCATION;
        },
        activeCenter: function () {
            return this.getCurrentLocation().center;
        },
        activeZoom: function () {
            return this.getCurrentLocation().zoom;
        }
    };
})();
