/**
 * MapDistance – First-usage guided tour (spotlight onboarding).
 * Shows a short walkthrough highlighting core features. Runs automatically on
 * first visit (persisted via localStorage), always runs when ?debug=1 is set,
 * and can be re-launched at any time via the "Tour" button.
 */
(function (md) {
    'use strict';

    var STORAGE_KEY = 'mapdistance_tour_done';

    var STEPS = [
        {
            target: null,
            title: 'Welcome to Pitch Liner',
            body: 'The Whitehall Colmcille GAA Pitch Liner App lets you find our venues and mark out lines and areas for laying out juvenile pitches and training zones.'
        },
        {
            target: '#map',
            title: 'Add pins to a path',
            body: 'Click anywhere on the map to add pins to a path.'
        },
        {
            target: '.btn-dark[onclick="newPath()"]',
            title: 'Start a new path',
            body: 'Click "New Path" or press N to start a new path.'
        },
        {
            target: '#location-select',
            title: 'Switch locations',
            body: 'You can quickly jump between our various pitch locations or search for other venues.',
            targetGroup: '#location-select, #search-input'
        },
        {
            target: '.btn-success[onclick="saveCsv()"]',
            title: 'Save, load or share',
            body: 'You can save/load or share your map with others.',
            targetGroup: '.btn-success[onclick="saveCsv()"], .btn-primary[onclick*="load-input"], .btn-purple[onclick="shareUrl()"]'
        },
        {
            target: '.btn-info[onclick="showHelp()"]',
            title: 'Need more help?',
            body: 'Click the help button to find out other features like keyboard shortcuts, path labeling, path distance options, color palettes and more.'
        }
    ];

    var currentStep = -1;
    var active = false;
    var repositionHandler = null;

    var debugFlag = new URLSearchParams(window.location.search).get('debug');
    var debugTourEnabled = debugFlag !== null && debugFlag !== '0' && debugFlag.toLowerCase() !== 'false';

    function ensureRoot() {
        var root = document.getElementById('tour-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'tour-root';
            document.body.appendChild(root);
        }
        return root;
    }

    function targetRects(step) {
        var selector = step.targetGroup || step.target;
        if (!selector) return [];
        var els = document.querySelectorAll(selector);
        var rects = [];
        els.forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) rects.push(r);
        });
        return rects;
    }

    function unionRect(rects) {
        if (!rects.length) return null;
        var top = Math.min.apply(null, rects.map(function (r) { return r.top; }));
        var left = Math.min.apply(null, rects.map(function (r) { return r.left; }));
        var bottom = Math.max.apply(null, rects.map(function (r) { return r.bottom; }));
        var right = Math.max.apply(null, rects.map(function (r) { return r.right; }));
        return { top: top, left: left, bottom: bottom, right: right, width: right - left, height: bottom - top };
    }

    function render() {
        var root = ensureRoot();
        root.innerHTML = '';

        var step = STEPS[currentStep];
        var pad = 8;
        var rect = unionRect(targetRects(step));

        if (rect) {
            var vw = window.innerWidth;
            var vh = window.innerHeight;
            var top = Math.max(0, rect.top - pad);
            var left = Math.max(0, rect.left - pad);
            var right = Math.min(vw, rect.right + pad);
            var bottom = Math.min(vh, rect.bottom + pad);

            [
                { position: 'fixed', top: '0', left: '0', width: '100%', height: top + 'px' },
                { position: 'fixed', top: bottom + 'px', left: '0', width: '100%', height: (vh - bottom) + 'px' },
                { position: 'fixed', top: top + 'px', left: '0', width: left + 'px', height: (bottom - top) + 'px' },
                { position: 'fixed', top: top + 'px', left: right + 'px', width: (vw - right) + 'px', height: (bottom - top) + 'px' }
            ].forEach(function (style) {
                var part = document.createElement('div');
                part.className = 'tour-overlay-part';
                Object.keys(style).forEach(function (k) { part.style[k] = style[k]; });
                root.appendChild(part);
            });

            var ring = document.createElement('div');
            ring.className = 'tour-highlight-ring';
            ring.style.top = top + 'px';
            ring.style.left = left + 'px';
            ring.style.width = (right - left) + 'px';
            ring.style.height = (bottom - top) + 'px';
            root.appendChild(ring);
        } else {
            var backdrop = document.createElement('div');
            backdrop.className = 'tour-overlay-part';
            backdrop.style.position = 'fixed';
            backdrop.style.inset = '0';
            backdrop.style.width = '100%';
            backdrop.style.height = '100%';
            root.appendChild(backdrop);
        }

        var callout = document.createElement('div');
        callout.className = 'tour-callout';

        var counter = document.createElement('div');
        counter.className = 'tour-step-counter';
        counter.textContent = (currentStep + 1) + ' / ' + STEPS.length;
        callout.appendChild(counter);

        var title = document.createElement('h3');
        title.textContent = step.title;
        callout.appendChild(title);

        var body = document.createElement('p');
        body.textContent = step.body;
        callout.appendChild(body);

        var actions = document.createElement('div');
        actions.className = 'tour-actions';

        var skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'btn-link tour-skip';
        skip.textContent = 'Skip tour';
        skip.addEventListener('click', endTour);
        actions.appendChild(skip);

        var spacer = document.createElement('div');
        spacer.style.flex = '1';
        actions.appendChild(spacer);

        if (currentStep > 0) {
            var back = document.createElement('button');
            back.type = 'button';
            back.className = 'btn btn-secondary';
            back.textContent = 'Back';
            back.addEventListener('click', function () { goToStep(currentStep - 1); });
            actions.appendChild(back);
        }

        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'btn btn-info';
        next.textContent = currentStep === STEPS.length - 1 ? 'Done' : 'Next';
        next.addEventListener('click', function () {
            if (currentStep === STEPS.length - 1) {
                endTour();
            } else {
                goToStep(currentStep + 1);
            }
        });
        actions.appendChild(next);

        callout.appendChild(actions);
        root.appendChild(callout);

        positionCallout(callout, rect);
    }

    function positionCallout(callout, rect) {
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var cw = callout.offsetWidth || 300;
        var ch = callout.offsetHeight || 160;
        var margin = 16;

        var top, left;
        if (!rect) {
            top = (vh - ch) / 2;
            left = (vw - cw) / 2;
        } else {
            var spaceBelow = vh - rect.bottom;
            var spaceAbove = rect.top;
            if (spaceBelow >= ch + margin || spaceBelow >= spaceAbove) {
                top = Math.min(rect.bottom + margin, vh - ch - margin);
            } else {
                top = Math.max(margin, rect.top - ch - margin);
            }
            left = rect.left + (rect.width - cw) / 2;
        }

        top = Math.max(margin, Math.min(top, vh - ch - margin));
        left = Math.max(margin, Math.min(left, vw - cw - margin));

        callout.style.top = top + 'px';
        callout.style.left = left + 'px';
    }

    function goToStep(index) {
        currentStep = index;
        render();
    }

    function startTour(force) {
        if (!force && localStorage.getItem(STORAGE_KEY) && !debugTourEnabled) return;

        active = true;
        currentStep = 0;
        render();

        repositionHandler = function () { if (active) render(); };
        window.addEventListener('resize', repositionHandler);
        window.addEventListener('scroll', repositionHandler, true);
        document.addEventListener('keydown', onKeyDown);
    }

    function endTour() {
        active = false;
        currentStep = -1;
        var root = document.getElementById('tour-root');
        if (root) root.innerHTML = '';

        if (repositionHandler) {
            window.removeEventListener('resize', repositionHandler);
            window.removeEventListener('scroll', repositionHandler, true);
            repositionHandler = null;
        }
        document.removeEventListener('keydown', onKeyDown);

        localStorage.setItem(STORAGE_KEY, '1');
    }

    function onKeyDown(e) {
        if (!active) return;
        if (e.key === 'Escape') endTour();
    }

    window.startTour = startTour;
    md.startTour = startTour;
    md.debugTourEnabled = debugTourEnabled;

    document.addEventListener('DOMContentLoaded', function () {
        startTour(false);
    });
})(MapDistance);
