// src/app/views/courtsView.js
import { createElement } from '../../ui/dom.js';
import {
  getCourts, createCourt, updateCourt, deleteCourt
} from '../../core/api.js';

export function renderCourtsView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', { className: 'card-title', text: 'Manage Courts' });
  const subtitle = createElement('p', { className: 'card-subtitle', text: 'Create, edit and delete courts.' });

  const container = createElement('div');
  card.append(title, subtitle, container);
  root.appendChild(card);

  loadCourts(container);
}

async function loadCourts(container) {
  const courts = await getCourts();
  container.innerHTML = '';

  // FORM
  const form = document.createElement('form');
  form.className = 'form';

  form.innerHTML = `
    <section>
      <h3 class="form-section-title">New court</h3>
      <div class="form-grid">
        <div class="form-field">
          <label>CIF *</label>
          <input type="text" id="c_cif" required />
        </div>
        <div class="form-field">
          <label>Name *</label>
          <input type="text" id="c_name" required />
        </div>
        <div class="form-field form-field--full">
          <label>Address *</label>
          <input type="text" id="c_addr" required />
        </div>
      </div>
    </section>
    <div id="court_msg" class="form-messages"></div>
    <button class="primary-button" type="submit">Create Court</button>
  `;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('court_msg');

    const data = {
      cif: document.getElementById('c_cif').value.trim(),
      name: document.getElementById('c_name').value.trim(),
      address: document.getElementById('c_addr').value.trim()
    };

    const result = await createCourt(data);
    if (!result.ok) {
      msg.innerHTML = `<div class="form-error">${result.error}</div>`;
      return;
    }

    msg.innerHTML = `<div class="form-success">Court created.</div>`;
    loadCourts(container);
  });

  container.appendChild(form);

  // LIST
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '1rem';

  table.innerHTML = `
    <tr>
      <th>CIF</th>
      <th>Name</th>
      <th>Address</th>
      <th>Actions</th>
    </tr>
  `;

  courts.forEach(c => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${c.cif}</td>
      <td>${c.name}</td>
      <td>${c.address}</td>
    `;

    const tdActions = document.createElement('td');

    // Edit
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'primary-button';
    editBtn.onclick = async () => {
      const newName = prompt("New name:", c.name);
      const newAddr = prompt("New address:", c.address);
      if (!newName || !newAddr) return;

      await updateCourt(c.cif, { name: newName, address: newAddr });
      loadCourts(container);
    };

    // Delete
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'nav-button';
    delBtn.style.marginLeft = '0.5rem';
    delBtn.onclick = async () => {
      if (!confirm("Delete this court?")) return;
      await deleteCourt(c.cif);
      loadCourts(container);
    };

    tdActions.appendChild(editBtn);
    tdActions.appendChild(delBtn);
    tr.appendChild(tdActions);
    table.appendChild(tr);
  });

  container.appendChild(table);
}
