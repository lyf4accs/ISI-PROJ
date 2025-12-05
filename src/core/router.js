// src/core/router.js
export class Router {
  constructor(routes) {
    this.routes = routes;
  }

  navigate(route) {
    const fn = this.routes[route];
    if (typeof fn === 'function') {
      fn();   // ejecuta la función que App ya preparó con root
    } else {
      console.warn(`Route not found: ${route}`);
    }
  }
}
