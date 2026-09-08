/**
 * MapDistance – Drag an existing pin to a new position.
 *
 * Click-and-hold (or long-press on touch) any pin, in any path, to move it.
 * Lines, pin markers and labels follow live during the drag; distances, the
 * stats panel, the closed-shape area and the elevation value are recalculated
 * when the pin is dropped.
 */
(function (md) {
    'use strict';

    // Pointer travel (in pixels) before a press is treated as a drag rather than a click.
    var DRAG_THRESHOLD_PX = 4;
    // Press duration (ms) required before a touch becomes a pin drag, so that
    // ordinary swipes still pan the map.
    var TOUCH_HOLD_MS = 350;
    // Allowed finger movement (in pixels) during the long-press window.
    var TOUCH_HOLD_SLOP_PX = 10;

    var globalHandlersAttached = false;

    var dragging = false;
    var dragPath = null;
    var dragPinIndex = -1;
    var startPixel = null;
    var moved = false;
    var suppressNextClick = false;

    var pendingTouch = null;   // { path, pinIndex, pixel, position }
    var touchHoldTimer = null;

    function pixelOf(e) {
        return e && e.pixel ? [e.pixel[0], e.pixel[1]] : null;
    }

    function distanceMoved(pixel) {
        if (!startPixel || !pixel) return 0;
        var dx = pixel[0] - startPixel[0];
        var dy = pixel[1] - startPixel[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    function resolvePin(e) {
        if (!e || !e.shapes || e.shapes.length === 0) return null;
        var shape = e.shapes[0];
        var props = typeof shape.getProperties === 'function' ? shape.getProperties() : shape.properties;
        if (!props || typeof props.pinIndex !== 'number') return null;
        var path = md.findPathById(props.pathId);
        if (!path || props.pinIndex >= path.pins.length) return null;
        return { path: path, pinIndex: props.pinIndex };
    }

    function setCursor(name) {
        if (!md.map || typeof md.map.getCanvasContainer !== 'function') return;
        var container = md.map.getCanvasContainer();
        if (!container) return;
        container.classList.remove('pin-grab', 'pin-grabbing');
        if (name) container.classList.add(name);
    }

    function setMapPanning(enabled) {
        if (md.map) md.map.setUserInteraction({ dragPanInteraction: enabled });
    }

    function cancelPendingTouch() {
        if (touchHoldTimer !== null) {
            clearTimeout(touchHoldTimer);
            touchHoldTimer = null;
        }
        pendingTouch = null;
    }

    function beginDrag(path, pinIndex, pixel) {
        dragging = true;
        dragPath = path;
        dragPinIndex = pinIndex;
        startPixel = pixel;
        moved = false;
        setMapPanning(false);
        setCursor('pin-grabbing');
    }

    function onLayerMouseDown(e) {
        var target = resolvePin(e);
        if (!target) return;
        if (e.preventDefault) e.preventDefault();
        beginDrag(target.path, target.pinIndex, pixelOf(e));
    }

    function onLayerTouchStart(e) {
        var target = resolvePin(e);
        if (!target) return;

        cancelPendingTouch();
        pendingTouch = {
            path: target.path,
            pinIndex: target.pinIndex,
            pixel: pixelOf(e)
        };
        touchHoldTimer = setTimeout(function () {
            if (!pendingTouch) return;
            beginDrag(pendingTouch.path, pendingTouch.pinIndex, pendingTouch.pixel);
            cancelPendingTouch();
        }, TOUCH_HOLD_MS);
    }

    function onLayerMouseEnter() {
        if (!dragging) setCursor('pin-grab');
    }

    function onLayerMouseLeave() {
        if (!dragging) setCursor('');
    }

    // Live update while dragging: geometry and labels only. The stats table and
    // area readout are deliberately deferred to the drop to avoid rebuilding the
    // whole panel on every pointer move.
    function onMapMove(e) {
        if (pendingTouch) {
            if (distanceMovedFrom(pendingTouch.pixel, pixelOf(e)) > TOUCH_HOLD_SLOP_PX) {
                cancelPendingTouch();
            }
            return;
        }
        if (!dragging || !e.position) return;

        if (!moved && distanceMoved(pixelOf(e)) > DRAG_THRESHOLD_PX) moved = true;
        if (!moved) return;

        var pin = dragPath.pins[dragPinIndex];
        pin.lon = e.position[0];
        pin.lat = e.position[1];

        md.rebuildPathGeometry(dragPath);
        md.updateLabels();
        if (dragPath.shapeClosed) md.refreshClosedShape(dragPath);
    }

    function distanceMovedFrom(from, to) {
        if (!from || !to) return 0;
        var dx = to[0] - from[0];
        var dy = to[1] - from[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    function onMapUp() {
        cancelPendingTouch();
        if (!dragging) return;

        var path = dragPath;
        var pinIndex = dragPinIndex;
        var didMove = moved;

        dragging = false;
        dragPath = null;
        dragPinIndex = -1;
        startPixel = null;
        moved = false;
        setMapPanning(true);
        setCursor('');

        if (!didMove) return;

        // Stop the click that Azure Maps raises after mouseup from dropping a new pin.
        suppressNextClick = true;
        setTimeout(function () { suppressNextClick = false; }, 400);

        md.recalcPathDistances(path);
        if (path.shapeClosed) md.refreshClosedShape(path);

        var pathIndex = md.indexOfPath(path);
        if (pathIndex >= 0 && pathIndex !== md.currentPathIndex) {
            md.setActivePath(pathIndex);
        } else {
            md.refreshActivePathUi();
        }

        var pin = path.pins[pinIndex];
        if (pin) md.updateElevationAt(path, pinIndex, pin.lat, pin.lon);
    }

    function attachGlobalHandlers() {
        if (globalHandlersAttached || !md.map) return;
        globalHandlersAttached = true;
        md.map.events.add('mousemove', onMapMove);
        md.map.events.add('touchmove', onMapMove);
        md.map.events.add('mouseup', onMapUp);
        md.map.events.add('touchend', onMapUp);
        md.map.events.add('mouseout', onMapUp);
    }

    function attachPinDragHandlers(path) {
        if (!md.map || !path || !path.symbolLayer) return;
        attachGlobalHandlers();
        md.map.events.add('mousedown', path.symbolLayer, onLayerMouseDown);
        md.map.events.add('touchstart', path.symbolLayer, onLayerTouchStart);
        md.map.events.add('mouseenter', path.symbolLayer, onLayerMouseEnter);
        md.map.events.add('mouseleave', path.symbolLayer, onLayerMouseLeave);
    }

    // Returns true (once) when the click immediately follows a pin drag.
    function consumePinDragClick() {
        if (!suppressNextClick) return false;
        suppressNextClick = false;
        return true;
    }

    md.attachPinDragHandlers = attachPinDragHandlers;
    md.consumePinDragClick = consumePinDragClick;
})(MapDistance);
