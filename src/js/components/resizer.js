/**
 * @fileoverview Resizer component used to watch an element and fire
 * an event when the object's width or height changes
 * @author lakenen
 */

/**
 * resizer component definition
 */
Crocodoc.addComponent('resizer', function (scope) {

    'use strict';

    var support = scope.getUtility('support'),
        dom = scope.getUtility('dom');

    // shorter way of defining
    // 'fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange'
    var FULLSCREENCHANGE_EVENT = ['', ' webkit', ' moz', ' ']
        .join('fullscreenchange') +
        // @NOTE: IE 11 uses upper-camel-case for this, which is apparently necessary
        'MSFullscreenChange';

    var element,
        frameWidth = 0,
        currentClientWidth,
        currentClientHeight,
        currentOffsetWidth,
        currentOffsetHeight,
        resizeFrameID,
        inIframe = (function () {
            try {
                return window.self !== window.top;
            } catch (e) {
                return true;
            }
        })();

    /**
     * Fire the resize event with the proper data
     * @returns {void}
     * @private
     */
    function broadcast() {
        scope.broadcast('resize', {
            // shortcuts for offsetWidth/height
            width: currentOffsetWidth,
            height: currentOffsetHeight,
            // client width is width of the inner, visible area
            clientWidth: currentClientWidth,
            clientHeight: currentClientHeight,
            // offset width is the width of the element, including border,
            // padding, and scrollbars
            offsetWidth: currentOffsetWidth,
            offsetHeight: currentOffsetHeight
        });
    }

    /**
     * Check if the element has resized every animation frame
     * @returns {void}
     * @private
     */
    function loop() {
        support.cancelAnimationFrame(resizeFrameID);
        checkResize();
        resizeFrameID = support.requestAnimationFrame(loop, element);
    }

    /**
     * Check if the element has resized, and broadcast the resize event if so
     * @returns {void}
     * @private
     */
    function checkResize () {
        var newOffsetHeight = element.offsetHeight,
            newOffsetWidth = element.offsetWidth;

        // check if we're in a frame
        if (inIframe) {
            // firefox has an issue where styles aren't calculated in hidden iframes
            // if the iframe was hidden and is now visible, broadcast a
            // layoutchange event
            if (frameWidth === 0 && window.innerWidth !== 0) {
                frameWidth = window.innerWidth;
                scope.broadcast('layoutchange');
                return;
            }
        }

        //on touch devices, the offset height is sometimes zero as content is loaded
        if (newOffsetHeight) {
            if (newOffsetHeight !== currentOffsetHeight || newOffsetWidth !== currentOffsetWidth) {
                currentOffsetHeight = newOffsetHeight;
                currentOffsetWidth = newOffsetWidth;
                currentClientHeight = element.clientHeight;
                currentClientWidth = element.clientWidth;
                broadcast();
            }
        }
    }

    return {

        messages: [
            'layoutchange'
        ],

        /**
         * Handle framework messages
         * @returns {void}
         */
        onmessage: function () {
            // force trigger resize when layout changes
            // @NOTE: we do this because the clientWidth/Height
            // could be different based on the layout (and whether
            // or not the new layout changes scrollbars)
            currentOffsetHeight = null;
            checkResize();
        },

        /**
         * Initialize the Resizer component with an element to watch
         * @param  {Element} el The element to watch
         * @returns {void}
         */
        init: function (el) {
            element = el;

            // use the documentElement for viewport dimensions
            // if we are using the window as the viewport
            if (element === window) {
                element = document.documentElement;
                dom.on(window, 'resize', checkResize);
                // @NOTE: we don't need to loop with
                // requestAnimationFrame in this case,
                // because we can rely on window.resize
                // events if the window is our viewport
                checkResize();
            } else {
                loop();
            }
           dom.on(document, FULLSCREENCHANGE_EVENT, checkResize);
        },

        /**
         * Destroy the Resizer component
         * @returns {void}
         */
        destroy: function () {
            dom.off(document, FULLSCREENCHANGE_EVENT, checkResize);
            dom.off(window, 'resize', checkResize);
            support.cancelAnimationFrame(resizeFrameID);
        }
    };
});
