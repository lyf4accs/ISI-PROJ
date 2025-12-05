// src/app/views/vipView.js
import { createElement } from '../../ui/dom.js';
import {
  getCourts,
  getDb,
  getVipCases,
  createVipCase,
  assignVipCase,
  finaliseVipCase
} from '../../core/api.js';

export function renderVipView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', { className: 'card-title', text: 'VIP Case Management' });
  const subtitle = createElement('p', {
    className: 'card-subtitle',
    text: 'Register, assign, and finalise VIP cases.'
  });

  const container = createElement('div');
  card.append(title, subtitle, container);
  root.appendChild(card);

  loadVip(container);
}

async function loadVip(container) {
  const db = await getDb();
  const courts = db.courts || [];
  const detectives = db.detectives || [];
  const vipCases = db.vip_cases || [];

  container.innerHTML = '';

  // -----------------------------------------------------------------------
  // 1) REGISTER VIP CASE
  // -----------------------------------------------------------------------
  const form = document.createElement('form');
  form.className = 'form';

  form.innerHTML = `
    <section>
      <h3 class="form-section-title">Register New VIP Case</h3>
      <div class="form-grid">

        <div class="form-field">
          <label>Court *</label>
          <select id="vip_court" required></select>
        </div>

        <div class="form-field">
          <label>Payment (€) *</label>
          <input type="number" id="vip_payment" min="1" required />
        </div>

        <div class="form-field">
          <label>Creation date *</label>
          <input type="text" id="vip_date" placeholder="DD/MM/YYYY" required />
        </div>

        <div class="form-field form-field--full">
          <label>Description *</label>
          <textarea id="vip_desc" rows="2" required></textarea>
        </div>

      </div>
    </section>

    <div id="vip_msg" class="form-messages"></div>
    <button type="submit" class="primary-button">Create VIP Case</button>
  `;

  // populate courts
  const selCourt = form.querySelector('#vip_court');
  courts.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.cif;
    opt.textContent = `${c.name} (${c.cif})`;
    selCourt.appendChild(opt);
  });

  // Submit register form
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('vip_msg');
    msg.innerHTML = '';

    const court_cif = selCourt.value;
    const payment = Number(document.getElementById('vip_payment').value);
    const desc = document.getElementById('vip_desc').value.trim();
    const date = document.getElementById('vip_date').value.trim();

    if (desc.length < 10) {
      msg.innerHTML = `<div class="form-error">Description must have at least 10 characters.</div>`;
      return;
    }

    if (!validateDate(date)) {
      msg.innerHTML = `<div class="form-error">Invalid date format or future date.</div>`;
      return;
    }

    if (payment <= 0) {
      msg.innerHTML = `<div class="form-error">Payment must be positive.</div>`;
      return;
    }

    const result = await createVipCase({
      court_cif,
      description: desc,
      payment,
      creation_date: date
    });

    if (!result.ok) {
      msg.innerHTML = `<div class="form-error">${result.error}</div>`;
      return;
    }

    msg.innerHTML = `<div class="form-success">VIP case created successfully.</div>`;
    loadVip(container);
  });

  container.appendChild(form);

  // -----------------------------------------------------------------------
  // 2) ASSIGN VIP CASE TO DETECTIVE
  // -----------------------------------------------------------------------

  const unassigned = vipCases.filter(v => !v.assigned_to && !v.completion_date);


  const assignCard = document.createElement('section');
  assignCard.innerHTML = `<h3 class="form-section-title">Assign VIP Case</h3>`;

  if (!unassigned.length) {
    const p = document.createElement('p');
    p.textContent = 'No unassigned VIP cases.';
    assignCard.appendChild(p);
  } else {
    const table = document.createElement('table');
    table.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Court</th>
        <th>Description</th>
        <th>Assign To</th>
        <th>Date</th>
        <th>Action</th>
      </tr>
    `;

    unassigned.forEach(v => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${v.vip_id}</td>
        <td>${v.court_cif}</td>
        <td>${v.description.slice(0, 40)}...</td>
      `;

      const tdDetective = document.createElement('td');
      const sel = document.createElement('select');

      detectives.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.national_id;
        opt.textContent = `${d.first_name} ${d.last_name} (Lvl ${d.level || '-'})`;
        sel.appendChild(opt);
      });
      tdDetective.appendChild(sel);

      const tdDate = document.createElement('td');
      const dateInput = document.createElement('input');
      dateInput.type = 'text';
      dateInput.placeholder = 'DD/MM/YYYY';
      tdDate.appendChild(dateInput);

      const tdAction = document.createElement('td');
      const btn = document.createElement('button');
      btn.textContent = 'Assign';
      btn.className = 'primary-button';

      btn.onclick = async () => {
        if (!validateDate(dateInput.value)) {
          alert('Invalid assignment date.');
          return;
        }

        // validate assignment date >= creation date
        if (!dateIsOnOrAfter(dateInput.value, v.creation_date)) {
          alert('Assignment date cannot be earlier than creation date.');
          return;
        }

        const result = await assignVipCase(v.vip_id, {
          detectiveId: sel.value,
          assignment_date: dateInput.value
        });

        if (!result.ok) {
          alert(result.error);
          return;
        }

        loadVip(container);
      };

      tdAction.appendChild(btn);

      tr.appendChild(tdDetective);
      tr.appendChild(tdDate);
      tr.appendChild(tdAction);
      table.appendChild(tr);
    });

    assignCard.appendChild(table);
  }

  container.appendChild(assignCard);

  // -----------------------------------------------------------------------
  // 3) FINALISE VIP CASE
  // -----------------------------------------------------------------------

  const assigned = vipCases.filter(v => v.assigned_to && !v.completion_date);


  const finalCard = document.createElement('section');
  finalCard.innerHTML = `<h3 class="form-section-title">Finalise VIP Case</h3>`;

  if (!assigned.length) {
    const p = document.createElement('p');
    p.textContent = 'No VIP cases ready for completion.';
    finalCard.appendChild(p);
  } else {
    const table = document.createElement('table');
    table.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Detective</th>
        <th>Description</th>
        <th>Completion Date</th>
        <th>Action</th>
      </tr>
    `;

    assigned.forEach(v => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${v.vip_id}</td>
        <td>${v.assigned_to}</td>
        <td>${v.description.slice(0, 40)}...</td>
      `;

      const tdDate = document.createElement('td');
      const dateInput = document.createElement('input');
      dateInput.type = 'text';
      dateInput.placeholder = 'DD/MM/YYYY';
      tdDate.appendChild(dateInput);

      const tdAction = document.createElement('td');
      const btn = document.createElement('button');
      btn.textContent = 'Finalise';
      btn.className = 'primary-button';

      btn.onclick = async () => {
        if (!validateDate(dateInput.value)) {
          alert('Invalid completion date.');
          return;
        }

        if (!dateIsOnOrAfter(dateInput.value, v.assignment_date)) {
          alert('Completion date cannot be earlier than assignment date.');
          return;
        }

        const result = await finaliseVipCase(v.vip_id, {
          completion_date: dateInput.value
        });

        if (!result.ok) {
          alert(result.error);
          return;
        }

        loadVip(container);
      };

      tdAction.appendChild(btn);

      tr.appendChild(tdDate);
      tr.appendChild(tdAction);
      table.appendChild(tr);
    });

    finalCard.appendChild(table);
  }

  container.appendChild(finalCard);

  // -----------------------------------------------------------------------
  // 4) LIST COMPLETED VIP CASES
  // -----------------------------------------------------------------------

  const completed = vipCases.filter(v => v.completion_date);

  const completedCard = document.createElement('section');
  completedCard.innerHTML = `<h3 class="form-section-title">Completed VIP Cases</h3>`;

  if (!completed.length) {
    const p = document.createElement('p');
    p.textContent = 'No completed VIP cases.';
    completedCard.appendChild(p);
  } else {
    const table = document.createElement('table');
    table.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Court</th>
        <th>Description</th>
        <th>Created</th>
        <th>Assigned</th>
        <th>Completed</th>
      </tr>
    `;

    completed.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.vip_id}</td>
        <td>${v.court_cif}</td>
        <td>${v.description.slice(0, 50)}...</td>
        <td>${v.creation_date}</td>
        <td>${v.assignment_date}</td>
        <td>${v.completion_date}</td>
      `;
      table.appendChild(tr);
    });

    completedCard.appendChild(table);
  }

  container.appendChild(completedCard);
}

// ---------------------------------------------------------------------------
// VALIDATION HELPERS
// ---------------------------------------------------------------------------

function validateDate(str) {
  const re = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!re.test(str)) return false;

  const [d, m, y] = str.split('/').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.toString() === 'Invalid Date') return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dt <= today;
}

function dateIsOnOrAfter(dateToCheck, referenceDate) {
  const [d1, m1, y1] = dateToCheck.split('/').map(Number);
  const [d2, m2, y2] = referenceDate.split('/').map(Number);

  const toCheck = new Date(y1, m1 - 1, d1);
  const ref = new Date(y2, m2 - 1, d2);

  return toCheck >= ref;
}
