import { Router } from '../core/router.js';
import { createElement } from '../ui/dom.js';

export class App {
  constructor(rootElement) {
    this.root = rootElement;
    this.router = new Router({
      home: () => this.renderHome(),
      about: () => this.renderAbout(),
    });
  }

  init() {
    this._setupNavListeners();
    this.router.navigate('home');
  }

  _setupNavListeners() {
    const buttons = document.querySelectorAll('[data-route]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const route = btn.getAttribute('data-route');
        this.router.navigate(route);
        this._updateActiveNav(route);
      });
    });
  }

  _updateActiveNav(activeRoute) {
    const buttons = document.querySelectorAll('[data-route]');
    buttons.forEach((btn) => {
      const route = btn.getAttribute('data-route');
      btn.classList.toggle('nav-button--active', route === activeRoute);
    });
  }

  renderHome() {
    this.root.innerHTML = '';

    const card = createElement('section', { className: 'card' });
    const title = createElement('h2', { className: 'card-title', text: 'Dashboard (Placeholder)' });
    const subtitle = createElement('p', {
      className: 'card-subtitle',
      text: 'Base architecture ready. We will plug actual features here once specs are defined.',
    });

    card.append(title, subtitle);
    this.root.appendChild(card);
  }

  renderAbout() {
    this.root.innerHTML = '';

    const card = createElement('section', { className: 'card' });
    const title = createElement('h2', { className: 'card-title', text: 'About this app' });
    const body = createElement('p', {
      text: 'This is a skeleton SPA using vanilla JS modules. Routing, state and a JSON-backed data layer will be added as we define the requirements.',
    });

    card.append(title, body);
    this.root.appendChild(card);
  }
}
