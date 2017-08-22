"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _router = require("router5");

var _router2 = _interopRequireDefault(_router);

var _router5LinkInterceptor = require("router5-link-interceptor");

var _router5LinkInterceptor2 = _interopRequireDefault(_router5LinkInterceptor);

var _browser = require("router5/plugins/browser");

var _browser2 = _interopRequireDefault(_browser);

var _listeners = require("router5/plugins/listeners");

var _listeners2 = _interopRequireDefault(_listeners);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Private store for Router.
 */
var Router = (0, _router2.default)(); /**
                                       * This router extends the functionality of Router 5.
                                       * Mostly the methods used in this router are simple wrapper around Router 5
                                       * @external http://router5.github.io/
                                       */

var routesStore = {};
var lastState = {};

/**
 *
 * @param routeMap [object] of the format
 * {
 *      moduleConfig:Config object of the module
 *      name: name of the route
 *      path: path of the route
 * }
 * @param Blinx [object]. Used to create and destory instances of modules.
 * <p>If shouldRender method is present in the moduleConfig of the module then the method is called.
 * If the value returned is false then the rendering does not happen.
 * Should render is an optional parameter in module</p>
 *
 * <p>Similarly if shouldDestroy is present in the moduleConfig of the module then the method is called.
 * If the value returned is false then the module is not destryed on route change.</p>
 *
 */
var addMethodsOnInstance = function addMethodsOnInstance(routeMap, Blinx) {

    routesStore[routeMap.moduleConfig.name] = routeMap.moduleConfig;

    routeMap.canActivate = function (toRoute, fromRoute, done) {

        if (Router.isActive(toRoute.name, toRoute.params, true, false)) {
            return true;
        }

        var moduleData = routesStore[routeMap.moduleConfig.name];

        lastState = toRoute;

        var parentsRouteArr = [];
        Object.keys(toRoute._meta).forEach(function (route) {
            if (Router.areStatesDescendants(Object.assign({ params: [] }, { name: route }), Object.assign({ params: [] }, moduleData))) {
                parentsRouteArr.push(route);
            }
        });
        var immediateParent = parentsRouteArr.reduce(function (prev, curr) {

            if (curr.split(".").length >= prev.split(".").length) {
                return curr;
            } else {
                return prev;
            }
        }, "");

        if (moduleData.module.shouldRender && moduleData.module.shouldRender(toRoute, fromRoute) || !moduleData.module.shouldRender) {
            return Blinx.createInstance(moduleData, immediateParent);
        }

        done();
    };

    Router.canDeactivate(routeMap.name, function (toRoute, fromRoute, done) {

        if (Router.isActive(toRoute.name, toRoute.params, true, true)) {
            return true;
        }

        var moduleData = routesStore[routeMap.moduleConfig.name];

        if (typeof moduleData.module.shouldDestroy === "function" && moduleData.module.shouldDestroy(toRoute, fromRoute)) {
            Blinx.destroyInstance(moduleData);
        } else if (typeof moduleData.module.shouldDestroy === "undefined") {
            Blinx.destroyInstance(moduleData);
        }

        moduleData.initialized = false;
        return true;
    });
};

/**
 * @param routeMap {Object|Array}. If array then iterates over routeMap to call {@link addMethodsOnInstance}
 */
var iterateToAddMethodsOnInstance = function iterateToAddMethodsOnInstance(routeMap, Blinx) {

    if (Array.isArray(routeMap)) {
        routeMap.forEach(function (route) {
            route.moduleConfig.name = route.name;
            addMethodsOnInstance(route, Blinx);
        });
    } else {
        addMethodsOnInstance(routeMap, Blinx);
    }
};

exports.default = {
    /**
     *
     * @param Blinx [object]
     */
    init: function init(Blinx) {
        this.Blinx = Blinx;
    },
    /**
     *
     * @param routeMap [array] of objects in the format
     * {
     *      moduleConfig:Config object of the module
     *      name: name of the route
     *      path: path of the route
     * }
     * @param config [object] Router configuration . This method internally calls the Router.setOption method of Router 5
     */
    configure: function configure(routeMap, config) {
        iterateToAddMethodsOnInstance(routeMap, this.Blinx);
        Router.add(routeMap);

        for (var key in config) {
            Router.setOption(key, config[key]);
        }

        if (config.logger) {
            Router.usePlugin((0, _router.loggerPlugin)());
        }

        if (config.history) {
            Router.usePlugin((0, _browser2.default)({
                useHash: true
            }));
        }

        if (config.listener) {
            Router.usePlugin((0, _listeners2.default)());
        }
    },
    /**
     * Method to register a route.
     * iterated through the map to create instances of modules then calls Router5.add
     * {@link external:http://router5.github.io/docs/api-reference.html}
     * @param routeMap
     */
    register: function register(routeMap) {
        iterateToAddMethodsOnInstance(routeMap, this.Blinx);
        Router.add(routeMap);
    },
    /**
     * calls {@link register}
     * @param routeMap
     */
    reRegister: function reRegister(routeMap) {
        this.register(routeMap);
        Router.stop();

        // Restore lastKnownState
        Router.lastKnownState = lastState;
        Router.start();
    },
    /**
     * Wrapper around calls Router5.navigate
     * {@link external:http://router5.github.io/docs/api-reference.html}
     * @param state The route name
     * @param props [Object={}] [optional] The route params
     * @param force Route options
     * @param replace Route options
     */
    go: function go(state, props, force, replace) {
        var opts = {};

        if (force) {
            opts.reload = true;
        }

        if (replace) {
            opts.replace = true;
        }
        Router.navigate(state, props, opts);
    },
    /**
     * Wrapper around Router5.usePlugin
     * @param middleware
     */
    usePlugin: function usePlugin(middleware) {
        Router.usePlugin(middleware);
    },
    /**
     * Wrapper around Router5.useMiddleware
     * @param fn
     */
    useMiddleware: function useMiddleware(fn) {
        Router.useMiddleware(fn);
    },
    /**
     * Wrapper around Router5.start
     */
    start: function start() {
        Router.start();
    },
    /**
     * Wrapper around Router5.stop
     */
    stop: function stop() {
        Router.stop();
    },
    /**
     * returns the parameters of the current route
     * @returns {*}
     */
    getRouteParams: function getRouteParams() {
        if (Object.keys(lastState).length > 0) {
            return Object.assign({}, lastState.params);
        } else {
            return Router.lastStateAttempt.params;
        }
    },

    addRouteListener: function addRouteListener() {
        return Router.addRouteListener.apply(this, arguments);
    },

    addListener: function addListener() {
        return Router.addListener.apply(this, arguments);
    },

    addNodeListener: function addNodeListener() {
        return Router.addNodeListener.apply(this, arguments);
    },
    /**
     * Returns the current route
     * @returns {*}
     */
    getCurrentRoute: function getCurrentRoute() {
        return lastState;
    },
    /**
     * changes the window url. uses window.location.href
     * @param url
     */
    navigate: function navigate(url) {
        window.location.href = url;
    },
    /**
     * router5-link-interceptor module
     */
    intercept: _router5LinkInterceptor2.default
};