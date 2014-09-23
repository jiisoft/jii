/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.controller.httpServer.Response
 * @extends Jii.controller.BaseResponse
 */
Jii.defineClass('Jii.controller.httpServer.Response', {

	__extends: Jii.controller.BaseResponse,

	__static: {

		FORMAT_RAW: 'raw',
		FORMAT_HTML: 'html',
		FORMAT_JSON: 'json',
		FORMAT_JSONP: 'jsonp',
		FORMAT_XML: 'xml',

		httpStatuses: {
			100: 'Continue',
			101: 'Switching Protocols',
			102: 'Processing',
			118: 'Connection timed out',
			200: 'OK',
			201: 'Created',
			202: 'Accepted',
			203: 'Non-Authoritative',
			204: 'No Content',
			205: 'Reset Content',
			206: 'Partial Content',
			207: 'Multi-Status',
			208: 'Already Reported',
			210: 'Content Different',
			226: 'IM Used',
			300: 'Multiple Choices',
			301: 'Moved Permanently',
			302: 'Found',
			303: 'See Other',
			304: 'Not Modified',
			305: 'Use Proxy',
			306: 'Reserved',
			307: 'Temporary Redirect',
			308: 'Permanent Redirect',
			310: 'Too many Redirect',
			400: 'Bad Request',
			401: 'Unauthorized',
			402: 'Payment Required',
			403: 'Forbidden',
			404: 'Not Found',
			405: 'Method Not Allowed',
			406: 'Not Acceptable',
			407: 'Proxy Authentication Required',
			408: 'Request Time-out',
			409: 'Conflict',
			410: 'Gone',
			411: 'Length Required',
			412: 'Precondition Failed',
			413: 'Request Entity Too Large',
			414: 'Request-URI Too Long',
			415: 'Unsupported Media Type',
			416: 'Requested range unsatisfiable',
			417: 'Expectation failed',
			418: 'I\'m a teapot',
			422: 'Unprocessable entity',
			423: 'Locked',
			424: 'Method failure',
			425: 'Unordered Collection',
			426: 'Upgrade Required',
			428: 'Precondition Required',
			429: 'Too Many Requests',
			431: 'Request Header Fields Too Large',
			449: 'Retry With',
			450: 'Blocked by Windows Parental Controls',
			500: 'Internal Server Error',
			501: 'Not Implemented',
			502: 'Bad Gateway ou Proxy Error',
			503: 'Service Unavailable',
			504: 'Gateway Time-out',
			505: 'HTTP Version not supported',
			507: 'Insufficient storage',
			508: 'Loop Detected',
			509: 'Bandwidth Limit Exceeded',
			510: 'Not Extended',
			511: 'Network Authentication Required'
		}
	},

    /**
     * @var string the response format. This determines how to convert [[data]] into [[content]]
     * when the latter is not set. By default, the following formats are supported:
     *
     * - [[FORMAT_RAW]]: the data will be treated as the response content without any conversion.
     *   No extra HTTP header will be added.
     * - [[FORMAT_HTML]]: the data will be treated as the response content without any conversion.
     *   The "Content-Type" header will set as "text/html" if it is not set previously.
     * - [[FORMAT_JSON]]: the data will be converted into JSON format, and the "Content-Type"
     *   header will be set as "application/json".
     * - [[FORMAT_JSONP]]: the data will be converted into JSONP format, and the "Content-Type"
     *   header will be set as "text/javascript". Note that in this case `$data` must be an array
     *   with "data" and "callback" elements. The former refers to the actual data to be sent,
     *   while the latter refers to the name of the JavaScript callback.
     * - [[FORMAT_XML]]: the data will be converted into XML format. Please refer to [[XmlResponseFormatter]]
     *   for more details.
     *
     * You may customize the formatting process or support additional formats by configuring [[formatters]].
     * @see formatters
     */
    format: null,

    /**
     * @var {array} the formatters for converting data into the response content of the specified [[format]].
     * The array keys are the format names, and the array values are the corresponding configurations
     * for creating the formatter objects.
     * @see format
     */
    formatters: null,

    /**
     * @var {*} the original response data. When this is not null, it will be converted into [[content]]
     * according to [[format]] when the response is being sent out.
     * @see content
     */
    data: null,

    /**
     * @var {string} the response content. When [[data]] is not null, it will be converted into [[content]]
     * according to [[format]] when the response is being sent out.
     * @see data
     */
    content: null,

    /**
     * @var {string} the charset of the text response. If not set, it will use
     * the value of [[Application::charset]].
     */
    charset: null,

    /**
     * @var {string} the HTTP status description that comes together with the status code.
     * @see httpStatuses
     */
    statusText: 'OK',

    /**
     * @var {string} the version of the HTTP protocol to use
     */
    version: null,

    /**
     * @var {number} the HTTP status code to send with the response.
     */
    _statusCode: 200,

    /**
     * @var {object}
     */
    _headers: null,

    /**
     * @var {object|null}
     */
    _cookies: null,

    _nativeResponse: null,

    constructor: function (nativeResponse) {
        this._nativeResponse = nativeResponse;

        this.init();
    },

    init: function() {
        // Set default format
        this.format = this.__static.FORMAT_HTML;

        // Detect http version (1.0 or 1.1)
        this.version = this._nativeResponse.req.httpVersion;

        // Set default charset
        if (this.charset === null) {
            this.charset = Jii.app.charset;
        }
    },

    /**
     * @return {number} the HTTP status code to send with the response.
     */
    getStatusCode: function() {
        return this._statusCode;
    },

    /**
     * Sets the response status code.
     * This method will set the corresponding status text if `text` is null.
     * @param {number} [value] the status code
     * @param {string} [text] the status text. If not set, it will be set automatically based on the status code.
     * @throws {Jii.exceptions.InvalidParamException} if the status code is invalid.
     */
    setStatusCode: function(value, text) {
        value = value || 200;
        text = text || null;

        this._statusCode = parseInt(value);
        if (this.isInvalid()) {
            throw new Jii.exceptions.InvalidParamException();
        }

        this.statusText = text || this.__static.httpStatuses[this._statusCode] || '';
    },

    /**
     * Returns the header collection.
     * The header collection contains the currently registered HTTP headers.
     * @return {Jii.controller.HeaderCollection} the header collection
     */
    getHeaders: function() {
        if (this._headers === null) {
            this._headers = new Jii.controller.HeaderCollection();
        }
        return this._headers;
    },

    /**
     * Sends the response to the client.
     */
    send: function() {
        if (this.isSent) {
            return;
        }

        //this.trigger(self::EVENT_BEFORE_SEND);
        this._prepare();
        //this.trigger(self::EVENT_AFTER_PREPARE);
        this._sendHeaders();
        this._sendContent();
        //this.trigger(self::EVENT_AFTER_SEND);
        this.isSent = true;
    },

    /**
     * Clears the headers, cookies, content, status code of the response.
     */
    clear: function() {
        this._headers = null;
        this._cookies = null;
        this._statusCode = 200;
        this.statusText = 'OK';
        this.data = null;
        this.content = null;
        this.isSent = false;
    },

    /**
     * Sends the response headers to the client
     */
    _sendHeaders: function() {
        this._nativeResponse.status(this.getStatusCode());
        this._nativeResponse.set(this.getHeaders().toObject());
        this._sendCookies();
    },

    /**
     * Sends the cookies to the client.
     */
    _sendCookies: function() {
        if (this._cookies === null) {
            return;
        }

        // @todo Also need set age, path, ..
        _.each(this._cookies, function(value, key) {
            //this._nativeResponse.cookie(key, value);
        }.bind(this));
    },

    /**
     * Sends the response content to the client
     */
    _sendContent: function() {
        this._nativeResponse.send(this.content);
    },

    /**
     * Sends a file to the browser.
     *
     * Note that this method only prepares the response for file sending. The file is not sent
     * until [[send()]] is called explicitly or implicitly. The latter is done after you return from a controller action.
     *
     * @param {string} filePath the path of the file to be sent.
     * @param {string} [attachmentName] the file name shown to the user. If null, it will be determined from `filePath`.
     * @param {string} [mimeType] the MIME type of the content. If null, it will be guessed based on `filePath`
     * @return static the response object itself
     */
    sendFile: function(filePath, attachmentName, mimeType) {
        attachmentName = attachmentName || null;
        mimeType = mimeType || null;

        // @todo
        this._nativeResponse.sendFile(filePath);
    },

    /**
     * Redirects the browser to the specified URL.
     *
     * This method adds a "Location" header to the current response. Note that it does not send out
     * the header until [[send()]] is called. In a controller action you may use this method as follows:
     *
     * ~~~
     * return Yii::$app->getResponse()->redirect($url);
     * ~~~
     *
     * In other places, if you want to send out the "Location" header immediately, you should use
     * the following code:
     *
     * ~~~
     * Yii::$app->getResponse()->redirect($url)->send();
     * return;
     * ~~~
     *
     * In AJAX mode, this normally will not work as expected unless there are some
     * client-side JavaScript code handling the redirection. To help achieve this goal,
     * this method will send out a "X-Redirect" header instead of "Location".
     *
     * If you use the "yii" JavaScript module, it will handle the AJAX redirection as
     * described above. Otherwise, you should write the following JavaScript code to
     * handle the redirection:
     *
     * ~~~
     * $document.ajaxComplete(function (event, xhr, settings) {
	 *     var url = xhr.getResponseHeader('X-Redirect');
	 *     if (url) {
	 *         window.location = url;
	 *     }
	 * });
     * ~~~
     *
     * @param {string|array} url the URL to be redirected to. This can be in one of the following formats:
     *
     * - a string representing a URL (e.g. "http://example.com")
     * - a string representing a URL alias (e.g. "@example.com")
     * - an array in the format of `[$route, ...name-value pairs...]` (e.g. `['site/index', 'ref' => 1]`).
     *   Note that the route is with respect to the whole application, instead of relative to a controller or module.
     *   [[Html::url()]] will be used to convert the array into a URL.
     *
     * Any relative URL will be converted into an absolute one by prepending it with the host info
     * of the current request.
     *
     * @param {number} [statusCode] the HTTP status code. Defaults to 302.
     * See <http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html>
     * for details about HTTP status code
     * @return static the response object itself
     */
    redirect: function(url, statusCode) {
        statusCode = statusCode || 302;

        if (_.isArray(url) && url[0]) {
            // ensure the route is absolute
            url[0] = '/'._.ltrim(url[0], '/');
        }

        // @todo
        /*$url = Html::url($url);
        if (strpos($url, '/') === 0 && strpos($url, '//') !== 0) {
            $url = Yii::$app->getRequest()->getHostInfo() . $url;
        }

        if (Yii::$app->getRequest()->getIsPjax()) {
            this.getHeaders()->set('X-Pjax-Url', $url);
        } elseif (Yii::$app->getRequest()->getIsAjax()) {
            this.getHeaders()->set('X-Redirect', $url);
        } else {
            this.getHeaders()->set('Location', $url);
        }
        this.setStatusCode($statusCode);

        return $this;*/
    },

    refresh: function() {
        // @todo
    },

    /**
     * @return {boolean} whether this response has a valid [[statusCode]].
     */
    isInvalid: function() {
        return this.getStatusCode() < 100 || this.getStatusCode() >= 600;
    },

    /**
     * @return {boolean} whether this response is informational
     */
    isInformational: function() {
        return this.getStatusCode() >= 100 && this.getStatusCode() < 200;
    },

    /**
     * @return {boolean} whether this response is successful
     */
    isSuccessful: function() {
        return this.getStatusCode() >= 200 && this.getStatusCode() < 300;
    },

    /**
     * @return {boolean} whether this response is a redirection
     */
    isRedirection: function() {
        return this.getStatusCode() >= 300 && this.getStatusCode() < 400;
    },

    /**
     * @return {boolean} whether this response indicates a client error
     */
    isClientError: function() {
        return this.getStatusCode() >= 400 && this.getStatusCode() < 500;
    },

    /**
     * @return {boolean} whether this response indicates a server error
     */
    isServerError: function() {
        return this.getStatusCode() >= 500 && this.getStatusCode() < 600;
    },

    /**
     * @return {boolean} whether this response is OK
     */
    isOk: function() {
        return this.getStatusCode() == 200;
    },

    /**
     * @return {boolean} whether this response indicates the current request is forbidden
     */
    isForbidden: function() {
        return this.getStatusCode() == 403;
    },

    /**
     * @return {boolean} whether this response indicates the currently requested resource is not found
     */
    isNotFound: function() {
        return this.getStatusCode() == 404;
    },

    /**
     * @return {boolean} whether this response is empty
     */
    isEmpty: function() {
        return _.indexOf([201, 204, 304], this.getStatusCode()) !== -1;
    },

    /**
     * Prepares for sending the response.
     * The default implementation will convert [[data]] into [[content]] and set headers accordingly.
     * @throws {Jii.exceptions.InvalidConfigException} if the formatter for the specified format is invalid or [[format]] is not supported
     */
    _prepare: function() {
        if (this.data === null) {
            return;
        }

        if (_.has(this.formatters, this.format)) {
            var formatter = this.formatters[this.format];

            // Lazy create instance
            // @todo

        } else {
            switch (this.format) {
                case this.__static.FORMAT_HTML:
                    this.getHeaders().setDefault('Content-Type', 'text/html; charset=' + this.charset);
                    this.content = this.data;
                    break;

                case this.__static.FORMAT_RAW:
                    this.content = this.data;
                    break;

                case this.__static.FORMAT_JSON:
                    this.getHeaders().set('Content-Type', 'application/json; charset=UTF-8');
                    this.content = JSON.stringify(this.data);
                    break;

                case this.__static.FORMAT_JSONP:
                    this.getHeaders().set('Content-Type', 'text/javascript; charset=' + this.charset);
                    if (_.isObject(this.data) && _.has(this.data, 'data') && _.has(this.data, 'callback')) {
                        this.content = this.data.callback + '(' + JSON.stringify(this.data.data) + ');';
                    } else {
                        this.content = '';
                        //Yii::warning("The 'jsonp' response requires that the data be an array consisting of both 'data' and 'callback' elements.", __METHOD__);
                    }
                    break;

                case this.__static.FORMAT_XML:
                    // @todo
                    //Yii::createObject(XmlResponseFormatter::className())->format($this);
                    break;

                default:
                    throw new Jii.exceptions.InvalidConfigException("Unsupported response format: " + this.format);
            }
        }

        if (!_.isString(this.content)) {
            throw new Jii.exceptions.InvalidParamException("Response content must be a string.");
        }

        if (_.isObject(this.content)) {
            this.content = this.content.toString();
        }
    }


});
