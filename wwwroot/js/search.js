/**
 * MapDistance – Address search via server-side proxy.
 */
(function (md) {
    'use strict';

    var searchTimeout = null;

    document.addEventListener('DOMContentLoaded', function () {
        var searchInput = document.getElementById('search-input');
        var searchResults = document.getElementById('search-results');

        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            var q = searchInput.value.trim();
            if (q.length < 3) { searchResults.style.display = 'none'; return; }
            searchTimeout = setTimeout(function () {
                var cam = md.map.getCamera();
                var searchUrl = '/api/maps/search?q=' + encodeURIComponent(q) +
                    '&lat=' + cam.center[1].toFixed(6) +
                    '&lon=' + cam.center[0].toFixed(6);
                fetch(searchUrl)
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        searchResults.innerHTML = '';
                        // Merge POI-first, then fuzzy, deduplicated by position
                        var allResults = [];
                        var seen = {};
                        function addResults(results) {
                            if (!results) return;
                            for (var i = 0; i < results.length; i++) {
                                var item = results[i];
                                if (!item.position) continue;
                                var key = item.position.lat.toFixed(4) + ',' + item.position.lon.toFixed(4);
                                if (!seen[key]) {
                                    seen[key] = true;
                                    allResults.push(item);
                                }
                            }
                        }
                        // POI results first for better local place ranking
                        if (data.poi) addResults(data.poi.results);
                        if (data.fuzzy) addResults(data.fuzzy.results);
                        // Fallback for old single-response format
                        if (data.results) addResults(data.results);

                        if (allResults.length > 0) {
                            var shown = allResults.slice(0, 8);
                            shown.forEach(function (item) {
                                var div = document.createElement('div');
                                div.className = 'search-item';
                                var label = '';
                                if (item.poi && item.poi.name) {
                                    label = item.poi.name;
                                    if (item.address && item.address.freeformAddress) {
                                        label += ' — ' + item.address.freeformAddress;
                                    }
                                } else if (item.address && item.address.freeformAddress) {
                                    label = item.address.freeformAddress;
                                }
                                div.textContent = label;
                                div.addEventListener('click', function () {
                                    md.map.setCamera({ center: [item.position.lon, item.position.lat], zoom: md.DEFAULT_ZOOM });
                                    searchResults.style.display = 'none';
                                    searchInput.value = label;
                                });
                                searchResults.appendChild(div);
                            });
                            searchResults.style.display = 'block';
                        } else { searchResults.style.display = 'none'; }
                    })
                    .catch(function () { searchResults.style.display = 'none'; });
            }, 300);
        });

        document.addEventListener('click', function (e) {
            if (!document.getElementById('search-bar').contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    });
})(MapDistance);
