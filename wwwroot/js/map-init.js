/**
 * MapDistance – Map initialisation.
 * Fetches the subscription key from the server-side proxy, then boots the Azure Maps control.
 */
(function (md) {
    'use strict';

    fetch('/api/maps/token')
        .then(function (r) { return r.json(); })
        .then(function (tokenData) {
            var map = new atlas.Map('map', {
                center: md.DEFAULT_CENTER,
                zoom: md.DEFAULT_ZOOM,
                style: md.DEFAULT_STYLE,
                authOptions: {
                    authType: 'subscriptionKey',
                    subscriptionKey: tokenData.subscriptionKey
                }
            });
            md.map = map;

            map.events.add('ready', function () {
                md.labelSource = new atlas.source.DataSource();
                map.sources.add(md.labelSource);

                var p = md.createPathObj(0);
                md.paths.push(p);
                md.initPathSources(p);

                map.layers.add(new atlas.layer.SymbolLayer(md.labelSource, 'labelLayer', {
                    iconOptions: { image: 'none' },
                    textOptions: {
                        textField: ['get', 'label'],
                        offset: [0, -2.2],
                        color: '#ffffff',
                        haloColor: '#000000',
                        haloWidth: 2,
                        size: 12,
                        allowOverlap: true
                    }
                }));
                map.layers.getLayerById('labelLayer').setOptions({ visible: false });

                map.events.add('click', function (e) {
                    if (e.position) {
                        md.addPin(e.position[1], e.position[0]);
                    }
                });

                md.loadFromHash();
            });
        })
        .catch(function (err) {
            console.error('Failed to load Azure Maps token:', err);
            if (typeof md.showError === 'function') {
                md.showError('Failed to initialise map. Please refresh the page.');
            }
        });
})(MapDistance);
