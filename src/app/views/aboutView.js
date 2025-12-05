// src/app/views/aboutView.js
import { createElement } from '../../ui/dom.js';

export function renderAboutView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', { className: 'card-title', text: 'About SIGED' });
  const body = createElement('p', {
    text: 'SIGED (Management System for Detectives) manages detective applications, approvals, levels and promotions. Exercise 1 implements the registration of applications with a dynamic JSON database and a one-application-per-month restriction.',
  });

  card.append(title, body);
  root.appendChild(card);
}
