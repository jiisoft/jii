'use strict';

var Jii = require('../BaseJii');
var Component = require('../base/Component');
var InvalidConfigException = require('../exceptions/InvalidConfigException');
var _isObject = require('lodash/isObject');
var _isEmpty = require('lodash/isEmpty');
var _isArray = require('lodash/isArray');

/**
 * @class Jii.data.Pagination
 * @extends Jii.base.Component
 */
var Pagination = Jii.defineClass('Jii.data.Pagination', /** @lends Jii.data.Pagination.prototype */{

    __extends: Component,

    __static: /** @lends exports */{

        /**
         * @event Jii.data.Pagination#change
         * @property {Jii.base.Event} event
         */
        EVENT_CHANGE: 'change',

        REL_SELF: 'self',
        LINK_NEXT: 'next',
        LINK_PREV: 'prev',
        LINK_FIRST: 'first',
        LINK_LAST: 'last',

        MODE_PAGES: 'pages',
        MODE_LOAD_MORE: 'load_more',

    },

    /**
     * @type {string} name of the parameter storing the current page index.
     * @see params
     */
    pageParam: 'page',

    /**
     * @type {string} name of the parameter storing the page size.
     * @see params
     */
    pageSizeParam: 'per-page',

    /**
     * @type {boolean} whether to always have the page parameter in the URL created by [[createUrl()]].
     * If false and [[page]] is 0, the page parameter will not be put in the URL.
     */
    forcePageParam: true,

    /**
     * @type {string|null} the route of the controller action for displaying the paged contents.
     * If not set, it means using the currently requested route.
     */
    route: null,

    /**
     * @type {[]} parameters (name => value) that should be used to obtain the current page number
     * and to create new pagination() URLs. If not set, all parameters from _GET will be used instead.
     *
     * In order to add hash to all links use `array_merge(_GET, {'#': 'my-hash'})`.
     *
     * The array element indexed by [[pageParam]] is considered to be the current page number (defaults to 0);
     * while the element indexed by [[pageSizeParam]] is treated as the page size (defaults to [[defaultPageSize]]).
     */
    params: null,

    /**
     * @type {Jii.request.UrlManager|null} the URL manager used for creating pagination URLs. If not set,
     * the "urlManager" application component will be used.
     */
    urlManager: null,

    /**
     * @type {boolean} whether to check if [[page]] is within valid range.
     * When this property is true, the value of [[page]] will always be between 0 and ([[pageCount]]-1).
     * Because [[pageCount]] relies on the correct value of [[totalCount]] which may not be available
     * in some cases (e.g. MongoDB), you may want to set this property to be false to disable the page
     * number validation. By doing so, [[page]] will return the value indexed by [[pageParam]] in [[params]].
     */
    validatePage: true,

    /**
     * @type {number} total number of items.
     */
    totalCount: 0,

    /**
     * @type {number} the default page size. This property will be returned by [[pageSize]] when page size
     * cannot be determined by [[pageSizeParam]] from [[params]].
     */
    defaultPageSize: 20,

    /**
     * @type {[]|boolean} the page size limits. The first array element stands for the minimal page size, and the second
     * the maximal page size. If this is false, it means [[pageSize]] should always return the value of [[defaultPageSize]].
     */
    pageSizeLimit: [1, 50],

    /**
     * @type {string}
     */
    mode: 'pages',

    /**
     * @type {number|null} number of items on each page.
     * If it is less than 1, it means the page size is infinite, and thus a single page contains all items.
     */
    _pageSize: null,

    /**
     * @type {number|null}
     */
    _page: null,

    /**
     * @type {Jii.base.Context}
     */
    _context: null,

    /**
     *
     * @param {Jii.base.Context} value
     */
    setContext(value) {
        if (this._context !== value) {
            this._context = value;

            // Refresh values from query params
            this._page = null;
            this.getPage();
            this._pageSize = null;
            this.getPageSize();

            this.trigger(this.__static.EVENT_CHANGE);
        }
    },

    /**
     *
     * @returns {Jii.base.Context}
     */
    getContext() {
        return this._context;
    },

    /**
     * @returns {number} number of pages
     */
    getPageCount() {
        let pageSize = this.getPageSize();
        if (pageSize < 1) {
            return this.totalCount > 0 ? 1 : 0;
        }

        let totalCount = Math.max(0, this.totalCount);
        return Math.floor((totalCount + pageSize - 1) / pageSize);
    },

    /**
     * Returns the zero-based current page number.
     * @param {boolean} [recalculate] whether to recalculate the current page based on the page size and item count.
     * @returns {number} the zero-based current page number.
     */
    getPage(recalculate) {
        recalculate = recalculate || false;

        if (this._page === null || recalculate) {
            let page = this._getQueryParam(this.pageParam, 1) - 1;
            this._setPageInternal(page, true);
        }

        return this._page;
    },

    /**
     * Sets the current page number.
     * @param {number} value the zero-based index of the current page.
     * @param {boolean} [validatePage] whether to validate the page number. Note that in order
     * to validate the page number, both [[validatePage]] and this parameter must be true.
     */
    setPage(value, validatePage = false) {
        this._setPageInternal(value, validatePage);
        this.trigger(this.__static.EVENT_CHANGE);
    },

    /**
     * Returns the number of items per page.
     * By default, this method will try to determine the page size by [[pageSizeParam]] in [[params]].
     * If the page size cannot be determined this way, [[defaultPageSize]] will be returned.
     * @returns {number} the number of items per page. If it is less than 1, it means the page size is infinite,
     * and thus a single page contains all items.
     * @see pageSizeLimit
     */
    getPageSize() {
        if (this._pageSize === null) {
            if (!this.pageSizeLimit || _isEmpty(this.pageSizeLimit)) {
                this._setPageSizeInternal(this.defaultPageSize);
            } else {
                this._setPageSizeInternal(this._getQueryParam(this.pageSizeParam, this.defaultPageSize), true);
            }
        }

        return this._pageSize;
    },

    /**
     * @param {number} value the number of items per page.
     * @param {boolean} [validatePageSize] whether to validate page size.
     */
    setPageSize(value, validatePageSize) {
        this._setPageSizeInternal(value, validatePageSize);
        this.trigger(this.__static.EVENT_CHANGE);
    },

    _setPageInternal(value, validatePage = false) {
        validatePage = validatePage || false;

        if (value === null) {
            this._page = null;
        } else {
            if (validatePage && this.validatePage) {
                let pageCount = this.getPageCount();
                if (value >= pageCount) {
                    value = pageCount - 1;
                }
            }
            if (value < 0) {
                value = 0;
            }
            this._page = value;
        }
    },

    _setPageSizeInternal(value, validatePageSize = false) {
        validatePageSize = validatePageSize || false;

        if (value === null) {
            this._pageSize = null;
        } else {
            if (validatePageSize && _isArray(this.pageSizeLimit) && this.pageSizeLimit.length === 2) {
                value = Math.max(this.pageSizeLimit[0], Math.min(this.pageSizeLimit[1], value));
            }
            this._pageSize = value;
        }
    },

    /**
     * Creates the URL suitable for pagination with the specified page number.
     * This method is mainly called by pagers when creating URLs used to perform pagination.
     * @param {number} page the zero-based page number that the URL should point to.
     * @param {number|null} [pageSize] the number of items on each page. If not set, the value of [[pageSize]] will be used.
     * @param {boolean} [isAbsolute] whether to create an absolute URL. Defaults to `false`.
     * @returns {string} the created URL
     * @see params
     * @see forcePageParam
     */
    createUrl(page, pageSize = null, isAbsolute = false) {

        if (this.params === null && this._context === null) {
            throw InvalidConfigException('Not found params and context in Pagination.');
        }

        let route = this.route || this._context.getRoute();
        let params = this.params || this._context.request ? this._context.request.get() : {};

        if (page > 0 || (page >= 0 && this.forcePageParam)) {
            params[this.pageParam] = page + 1;
        } else {
            delete params[this.pageParam];
        }

        if (pageSize <= 0) {
            pageSize = this.getPageSize();
        }
        if (pageSize != this.defaultPageSize) {
            params[this.pageSizeParam] = pageSize;
        } else {
            delete params[this.pageSizeParam];
        }

        const urlManager = this.urlManager || Jii.app.urlManager;
        return isAbsolute ?
            urlManager.createAbsoluteUrl([route, params], this._context) :
            urlManager.createUrl([route, params], this._context);
    },

    /**
     * @returns {number} the offset of the data. This may be used to set the
     * OFFSET value for a SQL statement for fetching the current page of data.
     */
    getOffset() {
        let pageSize = this.getPageSize();
        return pageSize < 1 ? 0 : this.getPage() * pageSize;
    },

    /**
     * @returns {number} the limit of the data. This may be used to set the
     * LIMIT value for a SQL statement for fetching the current page of data.
     * Note that if the page size is infinite, a value -1 will be returned.
     */
    getLimit() {
        let pageSize = this.getPageSize();
        return pageSize < 1 ? -1 : pageSize;
    },

    /**
     * @return {number[]}
     */
    getIndexes() {
        let indexes = [];
        let offset = this.mode === this.__static.MODE_PAGES ? this.getOffset() : 0;
        let limit = this.mode === this.__static.MODE_PAGES ? this.getLimit() : (this.getPage() + 1) * this.getLimit();

        if (offset >= 0 && limit > 0) {
            for (let i = offset; i < offset + limit; i++) {
                indexes.push(i);
            }
        }

        return indexes;
    },

    /**
     * Returns a whole set of links for navigating to the first, last, next and previous pages.
     * @param {boolean} isAbsolute whether the generated URLs should be absolute.
     * @returns {object} the links for navigational purpose. The array keys specify the purpose of the links (e.g. [[LINK_FIRST]]),
     * and the array values are the corresponding URLs.
     */
    getLinks(isAbsolute) {
        isAbsolute = isAbsolute || false;

        let currentPage = this.getPage();
        let pageCount = this.getPageCount();

        let links = {
            [this.__static.REL_SELF]: this.createUrl(currentPage, null, isAbsolute)
        };
        if (currentPage > 0) {
            links[this.__static.LINK_FIRST] = this.createUrl(0, null, isAbsolute);
            links[this.__static.LINK_PREV] = this.createUrl(currentPage - 1, null, isAbsolute);
        }
        if (currentPage < pageCount - 1) {
            links[this.__static.LINK_NEXT] = this.createUrl(currentPage + 1, null, isAbsolute);
            links[this.__static.LINK_LAST] = this.createUrl(pageCount - 1, null, isAbsolute);
        }

        return links;
    },

    toJSON() {
        return {
            page: this.getPage(),
            pageSize: this.getPageSize(),
        };
    },

    /**
     * Returns the value of the specified query parameter.
     * This method returns the named parameter value from [[params]]. Null is returned if the value does not exist.
     * @param {string} name the parameter name
     * @param {number|string} defaultValue the value to be returned when the specified parameter does not exist in [[params]].
     * @returns {string} the parameter value
     */
    _getQueryParam(name, defaultValue) {
        defaultValue = defaultValue || null;

        let params = this.params || (this._context && this._context.request ? this._context.request.get() : {});
        return params[name] && !_isObject(params[name]) ? params[name] : defaultValue;
    }

});

module.exports = Pagination;