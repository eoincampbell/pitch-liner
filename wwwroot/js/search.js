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
                fetch('/api/maps/search?q=' + encodeURIComponent(q))
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        searchResults.innerHTML = '';
                        if (data.results && data.results.length > 0) {
                            data.results.forEach(function (item) {
                                var div = document.createElement('div');
                                div.className = 'search-item';
                                div.textContent = item.address.freeformAddress;
                                div.addEventListener('click', function () {
                                    md.map.setCamera({ center: [item.position.lon, item.position.lat], zoom: md.DEFAULT_ZOOM });
                                    searchResults.style.display = 'none';
                                    searchInput.value = item.address.freeformAddress;
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
