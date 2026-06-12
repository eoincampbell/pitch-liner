/**
 * MapDistance – Application namespace and shared state.
 */
var MapDistance = (function () {
    'use strict';

    var DEFAULT_CENTER = [-6.241229, 53.386252];
    var DEFAULT_ZOOM = 18;
    var DEFAULT_STYLE = 'satellite_road_labels';

    var PATH_COLORS = [
        { line: '#ff0000', pin: 'marker-red',     hex: '#ff0000' },
        { line: '#1e90ff', pin: 'marker-blue',    hex: '#1e90ff' },
        { line: '#32cd32', pin: 'marker-darkblue', hex: '#32cd32' },
        { line: '#ff8c00', pin: 'marker-red',     hex: '#ff8c00' },
        { line: '#ff00ff', pin: 'marker-blue',    hex: '#ff00ff' },
        { line: '#00ced1', pin: 'marker-darkblue', hex: '#00ced1' },
        { line: '#ffd700', pin: 'marker-red',     hex: '#ffd700' },
        { line: '#8a2be2', pin: 'marker-blue',    hex: '#8a2be2' }
    ];

    var UNIT_CONFIG = {
        m:  { label: 'm',  factor: 1 },
        yd: { label: 'yd', factor: 1.09361 },
        km: { label: 'km', factor: 0.001 },
        mi: { label: 'mi', factor: 0.000621371 }
    };

    var MAX_CSV_SIZE = 1048576;
    var MAX_CSV_ROWS = 10000;

    return {
        DEFAULT_CENTER: DEFAULT_CENTER,
        DEFAULT_ZOOM: DEFAULT_ZOOM,
        DEFAULT_STYLE: DEFAULT_STYLE,
        PATH_COLORS: PATH_COLORS,
        UNIT_CONFIG: UNIT_CONFIG,
        MAX_CSV_SIZE: MAX_CSV_SIZE,
        MAX_CSV_ROWS: MAX_CSV_ROWS,

        map: null,
        labelSource: null,
        paths: [],
        currentPathIndex: 0,
        currentUnit: 'm',

        getPathColor: function (index) {
            return PATH_COLORS[index % PATH_COLORS.length];
        },
        curPath: function () {
            return this.paths[this.currentPathIndex];
        }
    };
})();
