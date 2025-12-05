// src/app/views/aboutView.js
import { createElement } from '../../ui/dom.js';

export function renderAboutView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });

  const title = createElement('h2', {
    className: 'card-title',
    text: 'About SIGED',
  });

  const body = createElement('div', {
    className: 'about-bubbles',
  });

  body.innerHTML = `
    <div class="bubble">
      <h3>What is SIGED?</h3>
      <p>SIGED is the internal Management System for Detectives. It centralizes all detective applications, role levels, promotions, photographic reports, courts, VIP cases, and report acquisitions.</p>
    </div>

    <div class="bubble">
      <h3>Exercise 1</h3>
      <ul>
        <li>Detective application form with full validation</li>
        <li>Manual date entry (DD/MM/YYYY) with real validation</li>
        <li>Automatic creation of new detectives</li>
        <li>One-application-per-month rule</li>
        <li>Approval system with level assignment</li>
        <li>Level price management</li>
        <li>Promotion system (upward only)</li>
      </ul>
    </div>

    <div class="bubble">
      <h3>Exercise 2</h3>
      <ul>
        <li>Creation and listing of photographic reports</li>
        <li>Full CRUD: Courts (create, edit, delete)</li>
        <li>Purchase slip creation</li>
        <li>Date validation (DD/MM/YYYY) without system clocks</li>
        <li>Automatic calculation: detective payment = price_per_photo × photos</li>
        <li>Restriction: court payment ≥ detective payment</li>
        <li>Listing of all purchase slips</li>
      </ul>
    </div>

    <div class="bubble">
      <h3>Exercise 3</h3>
      <ul>
        <li>Registration of VIP cases requested by courts</li>
        <li>Manual creation date with full DD/MM/YYYY validation</li>
        <li>Assignment of a VIP case to exactly one detective</li>
        <li>Validation: assignment date ≥ creation date</li>
        <li>Finalisation of VIP cases with completion date</li>
        <li>Validation: completion date ≥ assignment date</li>
        <li>Automatic status updates reflected in the UI</li>
        <li>Listing of all VIP cases: unassigned, assigned, and completed</li>
      </ul>
    </div>
  `;

  card.append(title, body);
  root.appendChild(card);
}
