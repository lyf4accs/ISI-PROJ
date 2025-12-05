// src/app/views/reportsView.js
import { createElement } from '../../ui/dom.js';
import { getDb } from '../../core/api.js';
import { getReports, createReport } from '../../core/api.js';

export function renderReportsView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', { className: 'card-title', text: 'Register New Report' });
  const subtitle = createElement('p', { className: 'card-subtitle', text: 'Create and list photographic reports.' });

  const container = createElement('div');
  card.append(title, subtitle, container);
  root.appendChild(card);

  loadReports(container);
}

async function loadReports(container) {
  const db = await getDb();
  const detectives = db.detectives || [];
  const reports = await getReports();

  container.innerHTML = '';

  // FORM
  const form = document.createElement('form');
  form.className = 'form';

  form.innerHTML = `
    <section>
      <h3 class="form-section-title">Report data</h3>
      <div class="form-grid">

        <div class="form-field">
          <label>Detective *</label>
          <select id="rep_detective" required></select>
        </div>

        <div class="form-field">
          <label>Number of photos *</label>
          <input type="number" id="rep_photos" min="1" required />
        </div>

        <div class="form-field form-field--full">
          <label>Description *</label>
          <textarea id="rep_desc" rows="2" required></textarea>
        </div>
      </div>
    </section>

    <div class="form-messages" id="rep_msgs"></div>
    <button type="submit" class="primary-button">Save Report</button>
  `;

  // Populate detective dropdown
  const sel = form.querySelector('#rep_detective');
  detectives.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.national_id;
    opt.textContent = `${d.first_name} ${d.last_name} (Lvl ${d.level || '-'})`;
    sel.appendChild(opt);
  });

  // Form submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('rep_msgs');
    msg.innerHTML = '';

    const detectiveId = sel.value;
    const photos = Number(document.getElementById('rep_photos').value);
    const desc = document.getElementById('rep_desc').value.trim();

    if (photos <= 0) {
      msg.innerHTML = `<div class="form-error">Number of photos must be ≥ 1.</div>`;
      return;
    }

    if (desc.length < 10) {
      msg.innerHTML = `<div class="form-error">Description must have at least 10 characters.</div>`;
      return;
    }

    const result = await createReport({
      detectiveId,
      num_photos: photos,
      description: desc,
    });

    if (!result.ok) {
      msg.innerHTML = `<div class="form-error">${result.error}</div>`;
      return;
    }

    msg.innerHTML = `<div class="form-success">Report created successfully.</div>`;
    loadReports(container);
  });

  container.appendChild(form);

  // LIST
  const listCard = document.createElement('section');
  listCard.innerHTML = `<h3 class="form-section-title">Existing Reports</h3>`;

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '1rem';
  table.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Detective</th>
      <th># Photos</th>
      <th>Description</th>
    </tr>
  `;

  reports.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.report_id}</td>
      <td>${r.detectiveId}</td>
      <td>${r.num_photos}</td>
      <td>${r.description.length > 50 ? r.description.slice(0, 50) + '...' : r.description}</td>
    `;
    table.appendChild(tr);
  });

  listCard.appendChild(table);
  container.appendChild(listCard);
}
