import { App } from './app/App.js';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');
  const app = new App(root);

  app.init();

  // footer year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
});
