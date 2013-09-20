var _        = require('underscore');
var Backbone = require('backbone');

var AJAX_TIMEOUT = 20000;

/**
 * Ajax middleware transportation protocol. Allows third-party to hook into the
 * middleware and augment properties such as the URL or request headers.
 *
 * @param  {Object} middleware
 */
module.exports = function (middleware) {
  /**
   * Send an ajax request and return the xhr request back to the final listener.
   *
   * @param  {Object}   options
   * @param  {Function} next
   */
  middleware.core('ajax', function (options, next) {
    var url     = options.url;
    var xhr     = new XMLHttpRequest();
    var method  = options.method || 'GET';
    var timeout = +options.timeout || AJAX_TIMEOUT;
    var ajaxTimeout;

    /**
     * Wraps callback functions to remove data.
     *
     * @param  {Function} fn
     * @return {Function}
     */
    var complete = function (fn) {
      return function () {
        clearTimeout(ajaxTimeout);
        // Remove all xhr callbacks.
        xhr.onload = xhr.onerror = xhr.onabort = null;
        // Call the function with the original arguments.
        return fn.apply(this, arguments);
      };
    };

    xhr.open(method, url, true);

    if (options.beforeSend) {
      options.beforeSend(xhr);
    }

    xhr.onload = complete(function () {
      return next(null, xhr);
    });

    xhr.onerror = xhr.onabort = complete(function () {
      return next(new Error(xhr.statusText || 'Ajax request aborted'), xhr);
    });

    xhr.send(options.data);

    // Set a request timeout
    ajaxTimeout = setTimeout(complete(function () {
      // Abort the current request.
      xhr.abort();
      // Call the `next` function with the timeout details.
      return next(new Error('Ajax timeout of ' + timeout + 'ms exceeded'), xhr);
    }), timeout);
  });
};
