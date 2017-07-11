### Config Router
Config Router is a wrapper over [Router5](http://router5.github.io/) following philosophy of Config driven approach. Config Router exposes only the methods/properties required in building a typical single page application.

#### Installation
Config Router distributables are available inside "dist" directory. And it can be included in any html using script tag as:
```
<script src="//raw.githubusercontent.com/sarunathan/config-router/master/dist/router.min.js"></script>
```
This way it will make configRouter available globally.

Blinx Router is available over npm also. It can be installed using npm as
```
npm install config-router --save
```
Which can be accessed as 
```
import configRouter from "config-router";
```

#### Usage
To start using Config Router, these basic steps are required:
```
// Require Config Router
import configRouter from "config-router";

// Initialize Router
configRouter.init(instance); // Where instance should implement "createInstance" and "destroInstance" method. 

// Configure Router
configRouter.configure(routeMap, routerOptions);

// Start Router
configRouter.start();
```

#### APIs

#### init: function
To intiliaze router, frameWorkInstance needs to be passed.
```
	configRouter.init(frameWorkInstance);
```
Where frameWorkInstance should implement "createInstance" and "destroInstance" method for creating and destroying UI components respectively.

#### configure: function
Accepts two parameters
1. Routes Config. Route needs to be defined as flat array of routes. Nested route names need to have their full name specified.
```
[
    { name: 'users',      path: '/users', moduleConfig: {}},
    { name: 'users.view', path: '/list', moduleConfig: {}},
    { name: 'users.list', path: '/view', moduleConfig: {}}
];
```
 * "name" and "path" are the mandatory attributes and should be unique for every route.
 * "moduleConfig" is the configuration of module which should be passed to BlinxJs to create instance. Its structure and its should be same as BlinxJs expects.
 * If shouldRender method is present over the module then the method is called before rendering the module with toRoute and fromRoute in params. If the value returned is false then the rendering does not happen. shouldRender is an optional property over module.
 *  If shouldDestroy method is present over the module then the method is called before destroying the module with toRoute and fromRoute in params. If the value returned is false then the destory does not happen. shouldDestroy is an optional property over module.


2. Router Options to control the behaviour of router. Sample config:
```
{
        useHash: true,
        hashPrefix: '!',
        defaultRoute: 'home',
        defaultParams: {},
        base: '',
        trailingSlash: false,
        autoCleanUp: true,
        strictQueryParams: true,
        logger: false,
        history: false,
        listener: false
}
```
* Use of hash part of URL - Set useHash to true if you want the paths of your routes to be prefixed with a hash. You can also choose a hashPrefix which will be inserted between the path of a route and the hash. Those options will mostly be used by plugins such as router5-history.

* Default route - When your router instance starts, it will navigate to a default route if such route is defined and if it cannot match the URL against a known route:

* Default params -  the default route params (defaults to {})

* Base path - You can specify what the base path of your application is. By default base is set to an empty string, meaning your route paths won't be prefixed by any path.

* Optional trailing slashes - By default, the router is in "strict match" mode. If you want trailing slashes to be optional, you can set trailingSlash to a truthy value.

* Automatic clean up - If autoCleanUp is set to true, the router will automatically clear canDeactivate functions / booleans when their associated segment becomes inactive.

* Strict query parameters - Query parameters are optional, meaning a route can still be matched if a query parameter defined in its path is not present. However, if extra query parameters are present in the path which is being matched, matching will fail. If you want the router to still match routes if extra query parameters are present, set strictQueryParams to false.

* logger - Enable router logger using logger plugin.

* history -  Enable history using history plugin.
 
* listener - Enable listener using listener plugin.


#### reRegister: function
This function can be used to add more routes once router has been initialized. This accepts the falt route array in param and it should not duplicate any route which has been already registered.

#### start: function
To start the router. This method does not require any parameter.

#### stop: function
To stop router once router has been started.

#### getRouteParams: function
Returns the route parameters. Both url and query params.

#### getCurrentRoute: function
Returns name and path along with current route params.
