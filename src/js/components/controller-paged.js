/**
 * @fileoverview controller-paged component
 * @author lakenen
 */

Crocodoc.addComponent('controller-paged', function (scope) {

    'use strict';

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    var util = scope.getUtility('common'),
        dom = scope.getUtility('dom');

    var config,
        el,
        lazyLoader;

    /**
     * Validates the config options
     * @returns {void}
     * @private
     */
    function validateConfig() {
        var metadata = config.metadata;
        config.numPages = metadata.numpages;
        if (!config.pageStart) {
            config.pageStart = 1;
        } else if (config.pageStart < 0) {
            config.pageStart = metadata.numpages + config.pageStart;
        }
        config.pageStart = util.clamp(config.pageStart, 1, metadata.numpages);
        if (!config.pageEnd) {
            config.pageEnd = metadata.numpages;
        } else if (config.pageEnd < 0) {
            config.pageEnd = metadata.numpages + config.pageEnd;
        }
        config.pageEnd = util.clamp(config.pageEnd, config.pageStart, metadata.numpages);
        config.numPages = config.pageEnd - config.pageStart + 1;
    }

    /**
     * Create the html skeleton for the viewer and pages
     * @returns {void}
     * @private
     */
    function prepareDOM() {
        var i, pageNum,
            zoomLevel, maxZoom,
            ptWidth, ptHeight,
            pxWidth, pxHeight,
            pt2px = util.calculatePtSize(),
            dimensions = config.metadata.dimensions,
            skeleton = '';

        // adjust page scale if the pages are too small/big
        // it's adjusted so 100% == DOCUMENT_100_PERCENT_WIDTH px;
        config.pageScale = DOCUMENT_100_PERCENT_WIDTH / (dimensions.width * pt2px);

        // add zoom levels to accomodate the scale
        zoomLevel = config.zoomLevels[config.zoomLevels.length - 1];
        maxZoom = 3 / config.pageScale;
        while (zoomLevel < maxZoom) {
            zoomLevel += zoomLevel / 2;
            config.zoomLevels.push(zoomLevel);
        }

        dimensions.exceptions = dimensions.exceptions || {};

        // create skeleton
        for (i = config.pageStart - 1; i < config.pageEnd; i++) {
            pageNum = i + 1;
            if (pageNum in dimensions.exceptions) {
                ptWidth = dimensions.exceptions[pageNum].width;
                ptHeight = dimensions.exceptions[pageNum].height;
            } else {
                ptWidth = dimensions.width;
                ptHeight = dimensions.height;
            }
            pxWidth = ptWidth * pt2px;
            pxHeight = ptHeight * pt2px;
            pxWidth *= config.pageScale;
            pxHeight *= config.pageScale;
            skeleton += util.template(Crocodoc.pageTemplate, {
                w: pxWidth,
                h: pxHeight
            });
        }

        // insert skeleton and keep a reference to the jq object
        dom.html(config.docEl, skeleton);
        config.pageEls = dom.findAll('.' + CSS_CLASS_PAGE, config.docEl);
    }

    /**
     * Return the expected conversion status of the given page index
     * @param   {int} pageIndex The page index
     * @returns {string}        The page status
     */
    function getInitialPageStatus(pageIndex) {
        if (config.conversionIsComplete ||
            (pageIndex === 0 && config.autoloadFirstPage)) {
            return PAGE_STATUS_NOT_LOADED;
        }
        return PAGE_STATUS_CONVERTING;
    }

    /**
     * Create and init all necessary page component instances
     * @returns {void}
     * @private
     */
    function createPages() {
        var i,
            pages = [],
            page,
            start = config.pageStart - 1,
            end = config.pageEnd,
            links = sortPageLinks();

        //initialize pages
        for (i = start; i < end; i++) {
            page = scope.createComponent('page');
            page.init(config.pageEls[i - start], {
                index: i,
                status: getInitialPageStatus(i),
                enableLinks: config.enableLinks,
                links: links[i],
                pageScale: config.pageScale
            });
            pages.push(page);
        }
        config.pages = pages;
    }

    /**
     * Returns all links associated with the given page
     * @param  {int} page The page
     * @returns {Array}   Array of links
     * @private
     */
    function sortPageLinks() {
        var i, len, link,
            links = config.metadata.links || [],
            sorted = [];

        for (i = 0, len = config.metadata.numpages; i < len; ++i) {
            sorted[i] = [];
        }

        for (i = 0, len = links.length; i < len; ++i) {
            link = links[i];
            sorted[link.pagenum - 1].push(link);
        }

        return sorted;
    }

    /**
     * Handle mouseup events
     * @returns {void}
     * @private
     */
    function handleMouseUp() {
        updateSelectedPages();
    }

    /**
     * Check if text is selected on any page, and if so, add a css class to that page
     * @returns {void}
     * @TODO(clakenen): this method currently only adds the selected class to one page,
     * so we should modify it to add the class to all pages with selected text
     * @private
     */
    function updateSelectedPages() {
        var node = util.getSelectedNode(),
            pageEl = dom.closest(node, '.'+CSS_CLASS_PAGE),
            selectedEl = dom.find('.'+CSS_CLASS_TEXT_SELECTED, el);

        dom.removeClass(selectedEl, CSS_CLASS_TEXT_SELECTED);
        if (node && dom.contains(pageEl, node)) {
            dom.addClass(pageEl, CSS_CLASS_TEXT_SELECTED);
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    return {

        /**
         * Initialize the controller
         * @returns {void}
         */
        init: function () {
            config = scope.getConfig();

            // Setup container
            el = config.el;

            dom.on(document, 'mouseup', handleMouseUp);

            validateConfig();
            prepareDOM();
            createPages();

            lazyLoader = scope.createComponent('lazy-loader');
            lazyLoader.init(config.pages);
        },

        /**
         * Destroy the viewer-base component
         * @returns {void}
         */
        destroy: function () {
            // remove document event handlers
            dom.off(document, 'mouseup', handleMouseUp);
        }
    };
});
