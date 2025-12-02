export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentRoute = null;
  }

  navigate(routeName) {
    if (!this.routes[routeName]) {
      console.warn(`Route "${routeName}" not found`);
      return;
    }
    this.currentRoute = routeName;
    this.routes[routeName]();
  }
}
