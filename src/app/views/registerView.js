// src/app/views/registerView.js
import { createElement } from '../../ui/dom.js';
import { registerApplication } from '../../core/api.js';   // ← FIX: antes importaba createApplication (NO existe)

export function renderRegisterView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', { className: 'card-title', text: 'New Application' });
  const subtitle = createElement('p', {
    className: 'card-subtitle',
    text: 'Submit a new detective application.',
  });

  const container = createElement('div');
  card.append(title, subtitle, container);
  root.appendChild(card);

  loadForm(container);
}

function loadForm(container) {
  container.innerHTML = `
    <form id="appForm" class="form">

      <section>
        <h3 class="form-section-title">Detective Data</h3>
        <div class="form-grid">

          <div class="form-field">
            <label>DNI *</label>
            <input id="dni" type="text" placeholder="12345678Z" required />
          </div>

          <div class="form-field">
            <label>First name *</label>
            <input id="first_name" type="text" required />
          </div>

          <div class="form-field">
            <label>Last name *</label>
            <input id="last_name" type="text" required />
          </div>

          <div class="form-field form-field--full">
            <label>Address *</label>
            <input id="address" type="text" required />
          </div>

          <div class="form-field">
            <label>City *</label>
            <input id="city" type="text" required />
          </div>

          <div class="form-field">
            <label>Postal Code *</label>
            <input id="postal_code" type="text" placeholder="46001" required />
          </div>

          <div class="form-field">
            <label>Telephone *</label>
            <input id="telephone" type="text" required />
          </div>

        </div>
      </section>

      <section>
        <h3 class="form-section-title">Application Details</h3>
        <div class="form-grid">

          <div class="form-field">
            <label>Date (DD/MM/YYYY) *</label>
            <input id="date" type="text" placeholder="DD/MM/YYYY" required />
          </div>

          <div class="form-field form-field--full">
            <label>Equipment *</label>
            <textarea id="equipment" rows="2" required></textarea>
          </div>

          <div class="form-field form-field--full">
            <label>CV *</label>
            <textarea id="cv" rows="2" required></textarea>
          </div>

        </div>
      </section>

      <div class="form-messages" id="msg_area"></div>
      <button type="submit" class="primary-button">Submit Application</button>

    </form>
  `;

  const form = container.querySelector('#appForm');
  const msg = container.querySelector('#msg_area');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.innerHTML = '';
    clearErrors(form);

    const payload = {
      national_id: val('dni'),
      first_name: val('first_name'),
      last_name: val('last_name'),
      address: val('address'),
      city: val('city'),
      postal_code: val('postal_code'),
      telephone: val('telephone'),
      date: val('date'),
      equipment: val('equipment'),
      cv: val('cv')
    };

    // Validate date:
    if (!validateDate(payload.date)) {
      showError('date', 'Invalid date. Must be DD/MM/YYYY and not in the future.');
      msg.innerHTML = `<div class="form-error">Invalid date.</div>`;
      return;
    }

    // SUBMIT FIX: use registerApplication()
    const result = await registerApplication(payload);

    if (!result.ok) {
      msg.innerHTML = `<div class="form-error">${result.error}</div>`;
      return;
    }

    msg.innerHTML = `<div class="form-success">Application submitted successfully.</div>`;
    form.reset();
  });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function val(id) {
  return document.getElementById(id).value.trim();
}

function showError(id, text) {
  const el = document.getElementById(id);
  el.classList.add('input-error');
}

function clearErrors(form) {
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function validateDate(dateStr) {
  const re = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!re.test(dateStr)) return false;

  const [d, m, y] = dateStr.split('/').map(Number);
  const input = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0,0,0,0);

  if (input.toString() === 'Invalid Date') return false;
  if (input > today) return false;

  return true;
}
