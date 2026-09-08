/**
 * MapDistance – Global keyboard shortcuts and the clear-all confirmation modal.
 *
 * Shortcuts (ignored while typing in a field, and while a modal is open only Escape acts):
 *   Shift + ?  Open the help modal
 *   Esc        Close any open modal
 *   n          New path
 *   z          Undo the last pin
 *   c          Close the active path (shape)
 *   a          Clear all paths (with confirmation)
 */
(function (md) {
    'use strict';

    var MODAL_IDS = ['help-modal', 'color-picker-modal', 'location-confirm-modal', 'clear-confirm-modal'];

    function openClearConfirm() {
        document.getElementById('clear-confirm-modal').classList.add('active');
    }

    function closeClearConfirm() {
        document.getElementById('clear-confirm-modal').classList.remove('active');
    }

    function confirmClearAll() {
        closeClearConfirm();
        md.clearAll();
        md.showSuccess('All paths cleared');
    }

    function cancelClearAll() {
        closeClearConfirm();
    }

    document.getElementById('clear-confirm-modal').addEventListener('click', function (e) {
        if (e.target === this) closeClearConfirm();
    });

    function anyModalOpen() {
        return MODAL_IDS.some(function (id) {
            var el = document.getElementById(id);
            return el && el.classList.contains('active');
        });
    }

    function closeAllModals() {
        window.closeHelp();
        window.closeColorPicker();
        window.cancelLocationSwitch();
        closeClearConfirm();
    }

    function isTypingTarget(target) {
        if (!target) return false;
        if (target.isContentEditable) return true;
        var tag = target.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    }

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (isTypingTarget(e.target)) return;

        if (e.key === 'Escape') {
            closeAllModals();
            return;
        }

        if (e.key === '?') {
            window.showHelp();
            return;
        }

        if (anyModalOpen()) return;

        switch (e.key.toLowerCase()) {
            case 'n':
                if (md.curPath().pins.length === 0) return;
                window.newPath();
                md.showSuccess('New path created');
                break;
            case 'z':
                if (md.curPath().pins.length === 0) return;
                window.undoLastPin();
                md.showSuccess('Last action undone');
                break;
            case 'c':
                window.closeShape();
                if (md.curPath().shapeClosed) md.showSuccess('Path closed');
                break;
            case 'a':
                openClearConfirm();
                break;
            default:
                return;
        }
    });

    window.openClearConfirm = openClearConfirm;
    window.confirmClearAll = confirmClearAll;
    window.cancelClearAll = cancelClearAll;

    md.openClearConfirm = openClearConfirm;
})(MapDistance);
