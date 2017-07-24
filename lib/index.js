"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _router = require("router5");

var _router5History = require("router5-history");

var _router5History2 = _interopRequireDefault(_router5History);

var _router5LinkInterceptor = require("router5-link-interceptor");

var _router5LinkInterceptor2 = _interopRequireDefault(_router5LinkInterceptor);

var _router5Listeners = require("router5-listeners");

var _router5Listeners2 = _interopRequireDefault(_router5Listeners);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Private store for Router.
 */
/**
 * This router extends the functionality of Router 5.
 * Mostly the methods used in this router are simple wrapper around Router 5
 * @external http://router5.github.io/
 */
var Router = new _router.Router5();
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
 * @param instances [object]. Used to create and destory instances of modules.
 * <p>If shouldRender method is present in the moduleConfig of the module then the method is called.
 * If the value returned is false then the rendering does not happen.
 * Should render is an optional parameter in module</p>
 *
 * <p>Similarly if shouldDestroy is present in the moduleConfig of the module then the method is called.
 * If the value returned is false then the module is not destryed on route change.</p>
 *
 */
var addMethodsOnInstance = function addMethodsOnInstance(routeMap, instances) {

    routesStore[routeMap.moduleConfig.name] = routeMap.moduleConfig;

    var getModuleData = function getModuleData() {
        var moduleData = routesStore[routeMap.moduleConfig.name];

        if (moduleData.instanceType && !instances[moduleData.instanceType] && !instances["default"]) {
            throw new Error("Instance Object passed in config-router doesn't have module 'type' that is passed in '$moduleData.moduleName'");
        }

        return moduleData;
    };

    routeMap.canActivate = function (toRoute, fromRoute, done) {

        var moduleData = getModuleData();

        var frameworkInstance = instances[moduleData.instanceType] || instances["default"];

        if (Router.isActive(toRoute.name, toRoute.params, true, false)) {
            return true;
        }

        lastState = toRoute;

        var parentsRouteArr = [];
        Object.keys(Router.lastStateAttempt._meta).forEach(function (route) {
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
            return frameworkInstance.createInstance(moduleData, immediateParent);
        }

        done();
    };

    Router.canDeactivate(routeMap.name, function (toRoute, fromRoute, done) {

        var moduleData = getModuleData();

        var frameworkInstance = instances[moduleData.instanceType] || instances["default"];

        if (Router.isActive(toRoute.name, toRoute.params, true, true)) {
            return true;
        }

        if (typeof moduleData.module.shouldDestroy === "function" && moduleData.module.shouldDestroy(toRoute, fromRoute)) {
            frameworkInstance.destroyInstance(moduleData);
        } else if (typeof moduleData.module.shouldDestroy === "undefined") {
            frameworkInstance.destroyInstance(moduleData);
        }

        moduleData.initialized = false;
        return true;
    });
};

/**
 * @param routeMap {Object|Array}. If array then iterates over routeMap to call {@link addMethodsOnInstance}
 */
var iterateToAddMethodsOnInstance = function iterateToAddMethodsOnInstance(routeMap, instances) {

    if (Array.isArray(routeMap)) {
        routeMap.forEach(function (route) {
            route.moduleConfig.name = route.name;
            addMethodsOnInstance(route, instances);
        });
    } else {
        addMethodsOnInstance(routeMap, instances);
    }
};

exports.default = {
    /**
     *
     * @param Instances [object]
     */
    init: function init(instances) {
        this.instances = instances;
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
        iterateToAddMethodsOnInstance(routeMap, this.instances);
        Router.add(routeMap);

        for (var key in config) {
            Router.setOption(key, config[key]);
        }

        if (config.logger) {
            Router.usePlugin((0, _router.loggerPlugin)());
        }

        if (config.history) {
            Router.usePlugin((0, _router5History2.default)());
        }

        if (config.listener) {
            Router.usePlugin((0, _router5Listeners2.default)());
        }
    },
    /**
     * Method to register a route.
     * iterated through the map to create instances of modules then calls Router5.add
     * {@link external:http://router5.github.io/docs/api-reference.html}
     * @param routeMap
     */
    register: function register(routeMap) {
        iterateToAddMethodsOnInstance(routeMap, this.instances);
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