/**
 * This router extends the functionality of Router 5.
 * Mostly the methods used in this router are simple wrapper around Router 5
 * @external http://router5.github.io/
 */
import {Router5, loggerPlugin} from "router5";
import historyPlugin from "router5-history";
import linkInterceptor from "router5-link-interceptor";
import listenersPlugin from "router5-listeners";

/**
 * Private store for Router.
 */
let Router = new Router5();
let routesStore = {};
let lastState = {};

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
let addMethodsOnInstance = function (routeMap, Blinx) {

    routesStore[routeMap.moduleConfig.name] = routeMap.moduleConfig;

    routeMap.canActivate = function (toRoute, fromRoute, done) {

        if (Router.isActive(toRoute.name, toRoute.params, true, false)) {
            return true;
        }

        let moduleData = routesStore[routeMap.moduleConfig.name];

        lastState = toRoute;

        let parentsRouteArr = [];
        Object.keys(Router.lastStateAttempt._meta).forEach( route => {
            if (Router.areStatesDescendants(Object.assign({params: []}, {name: route}), Object.assign({params: []}, moduleData))){
                parentsRouteArr.push(route);
            }
        });
        let immediateParent = parentsRouteArr.reduce((prev, curr) => {

            if(curr.split(".").length >= prev.split(".").length){
                return curr;
            } else {
                return prev;
            }
        }, "");

        if ((moduleData.module.shouldRender && moduleData.module.shouldRender(toRoute, fromRoute)) || !moduleData.module.shouldRender) {
            return Blinx.createInstance(moduleData, immediateParent);
        }

        done();
    };

    Router.canDeactivate(routeMap.name, function (toRoute, fromRoute, done) {

        if (Router.isActive(toRoute.name, toRoute.params, true, true)) {
            return true;
        }

        let moduleData = routesStore[routeMap.moduleConfig.name];

        if (moduleData.module.shouldDestroy && moduleData.module.shouldDestroy(toRoute, fromRoute)) {
            Blinx.destroyInstance(moduleData);
        }

        moduleData.initialized = false;
        return true;
    });
};

/**
 * @param routeMap {Object|Array}. If array then iterates over routeMap to call {@link addMethodsOnInstance}
 */
let iterateToAddMethodsOnInstance = function (routeMap, Blinx) {

    if (Array.isArray(routeMap)) {
        routeMap.forEach((route) => {
            route.moduleConfig.name = route.name;
            addMethodsOnInstance(route, Blinx);
        });
    } else {
        addMethodsOnInstance(routeMap, Blinx);
    }
};

export default {
    /**
     *
     * @param Blinx [object]
     */
    init: function (Blinx) {
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
    configure: function (routeMap, config) {
        iterateToAddMethodsOnInstance(routeMap, this.Blinx);
        Router.add(routeMap);

        for (let key in config) {
            Router.setOption(key, config[key]);
        }

        if (config.logger) {
            Router.usePlugin(loggerPlugin());
        }

        if (config.history) {
            Router.usePlugin(historyPlugin());
        }

        if (config.listener) {
            Router.usePlugin(listenersPlugin());
        }
    },
    /**
     * Method to register a route.
     * iterated through the map to create instances of modules then calls Router5.add
     * {@link external:http://router5.github.io/docs/api-reference.html}
     * @param routeMap
     */
    register: function (routeMap) {
        iterateToAddMethodsOnInstance(routeMap, this.Blinx);
        Router.add(routeMap);
    },
    /**
     * calls {@link register}
     * @param routeMap
     */
    reRegister: function (routeMap) {
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
    go: function (state, props, force, replace) {
        let opts = {};

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
    usePlugin: function (middleware) {
        Router.usePlugin(middleware);
    },
    /**
     * Wrapper around Router5.useMiddleware
     * @param fn
     */
    useMiddleware: function (fn) {
        Router.useMiddleware(fn)
    },
    /**
     * Wrapper around Router5.start
     */
    start: function () {
        Router.start();
    },
    /**
     * Wrapper around Router5.stop
     */
    stop: function () {
        Router.stop();
    },
    /**
     * returns the parameters of the current route
     * @returns {*}
     */
    getRouteParams: function () {
        if(Object.keys(lastState).length > 0){
            return Object.assign({}, lastState.params);
        } else {
            return Router.lastStateAttempt.params;
        }
    },

    addRouteListener: function (){
        return Router.addRouteListener.apply(this, arguments);
    },

    addListener: function (){
        return Router.addListener.apply(this, arguments);
    },

    addNodeListener: function (){
        return Router.addNodeListener.apply(this, arguments);
    },
    /**
     * Returns the current route
     * @returns {*}
     */
    getCurrentRoute: function () {
        return lastState;
    },
    /**
     * changes the window url. uses window.location.href
     * @param url
     */
    navigate: function (url) {
        window.location.href = url;
    },
    /**
     * router5-link-interceptor module
     */
    intercept: linkInterceptor
};