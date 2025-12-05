// src/app/views/slipsView.js
import { createElement } from '../../ui/dom.js';
import { getReports, getCourts, createSlip, getSlips } from '../../core/api.js';
import { getDb } from '../../core/api.js';

export function renderSlipsView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', { className: 'card-title', text: 'Acquire Report' });
  const subtitle = createElement('p', { className: 'card-subtitle', text: 'Create and list purchase slips.' });

  const container = createElement('div');
  card.append(title, subtitle, container);
  root.appendChild(card);

  loadSlips(container);
}

async function loadSlips(container) {
  const reports = await getReports();
  const courts = await getCourts();
  const db = await getDb();
  const slips = await getSlips();

  container.innerHTML = '';

  // FORM
  const form = document.createElement('form');
  form.className = 'form';

  form.innerHTML = `
    <section>
      <h3 class="form-section-title">Purchase Slip</h3>
      <div class="form-grid">

        <div class="form-field">
          <label>Report *</label>
          <select id="sl_report"></select>
        </div>

        <div class="form-field">
          <label>Court *</label>
          <select id="sl_court"></select>
        </div>

        <div class="form-field">
          <label>Price charged to court *</label>
          <input type="number" id="sl_price" min="0" required />
        </div>

        <div class="form-field">
          <label>Date (DD/MM/YYYY) *</label>
          <input type="text" id="sl_date" placeholder="DD/MM/YYYY" required />
        </div>

      </div>
    </section>

    <div id="slip_msg" class="form-messages"></div>
    <button class="primary-button" type="submit">Create Slip</button>
  `;

  // Populate dropdowns
  const selRep = form.querySelector('#sl_report');
  const selCourt = form.querySelector('#sl_court');

  reports.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.report_id;
    opt.textContent = `#${r.report_id} - ${r.description.slice(0, 30)}...`;
    selRep.appendChild(opt);
  });

  courts.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.cif;
    opt.textContent = `${c.name} (${c.cif})`;
    selCourt.appendChild(opt);
  });

  // Submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('slip_msg');
    msg.innerHTML = '';

    const court_cif = selCourt.value;
    const report_id = Number(selRep.value);
    const priceByCourt = Number(document.getElementById('sl_price').value);
    const date = document.getElementById('sl_date').value.trim();

    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

    if (!dateRegex.test(date)) {
      msg.innerHTML = `<div class="form-error">Invalid date format.</div>`;
      return;
    }

    const [d, m, y] = date.split('/').map(Number);
    const inputDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (inputDate > today) {
      msg.innerHTML = `<div class="form-error">Date cannot be in the future.</div>`;
      return;
    }

    const result = await createSlip({
      report_id,
      court_cif,
      amount_paid_by_court: priceByCourt,
      date
    });

    if (!result.ok) {
      msg.innerHTML = `<div class="form-error">${result.error}</div>`;
      return;
    }

    msg.innerHTML = `<div class="form-success">Slip created successfully.</div>`;
    loadSlips(container);
  });

  container.appendChild(form);

  // LIST
  const listCard = document.createElement('section');
  listCard.innerHTML = `<h3 class="form-section-title">Purchase Slips</h3>`;

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '1rem';

  table.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Report</th>
      <th>Court</th>
      <th>Paid by Court</th>
      <th>Paid to Detective</th>
      <th>Date</th>
    </tr>
  `;

  slips.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.slip_id}</td>
      <td>${s.report_id}</td>
      <td>${s.court_cif}</td>
      <td>${s.amount_paid_by_court} €</td>
      <td>${s.amount_paid_to_detective} €</td>
      <td>${s.date}</td>
    `;
    table.appendChild(tr);
  });

  listCard.appendChild(table);
  container.appendChild(listCard);
}
