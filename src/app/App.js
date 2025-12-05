// src/app/app.js
import { Router } from '../core/router.js';
import { renderRegisterView } from './views/registerView.js';
import { renderHistoricalView } from './views/historicalView.js';
import { renderAboutView } from './views/aboutView.js';
import { renderApprovalView } from './views/approvalView.js';
import { renderLevelsView } from './views/levelsView.js';
import { renderPromotionsView } from './views/promotionsView.js';
import { renderReportsView } from './views/reportsView.js';
import { renderCourtsView } from './views/courtsView.js';
import { renderSlipsView } from './views/slipsView.js';

export class App {
  constructor(rootElement) {
    this.root = rootElement;
    this.router = new Router({
      home: () => renderRegisterView(this.root),
      historical: () => renderHistoricalView(this.root),
      approvals: () => renderApprovalView(this.root),
      levels: () => renderLevelsView(this.root),
      promotions: () => renderPromotionsView(this.root),
      reports: () => renderReportsView(this.root),
      courts: () => renderCourtsView(this.root),
      slips: () => renderSlipsView(this.root),
      about: () => renderAboutView(this.root),
    });
  }

  init() {
    this._setupNavListeners();
    this.router.navigate('home');
    this._updateActiveNav('home');
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
}
