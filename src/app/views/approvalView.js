// src/app/views/approvalView.js
import { createElement } from '../../ui/dom.js';
import {
  getDb,
  getLevels,
  approveApplication,
  rejectApplication,
} from '../../core/api.js';

export function renderApprovalView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', {
    className: 'card-title',
    text: 'Approve / Reject Applications',
  });
  const subtitle = createElement('p', {
    className: 'card-subtitle',
    text: 'Review pending applications, assign level and approve or reject.',
  });

  const container = createElement('div', {});
  container.textContent = 'Loading applications...';

  card.append(title, subtitle, container);
  root.appendChild(card);

  loadApproval(container);
}

async function loadApproval(container) {
  const db = await getDb();
  const applications = db.applications || [];
  const detectives = db.detectives || [];
  const levels = await getLevels();

  container.innerHTML = '';

  if (!applications.length) {
    container.textContent = 'No applications registered.';
    return;
  }

  const section = document.createElement('section');
  section.innerHTML = `<h3 class="form-section-title">Applications (with status)</h3>`;

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '1rem';

  table.innerHTML = `
    <tr>
      <th>ID</th>
      <th>DNI</th>
      <th>Name</th>
      <th>Date</th>
      <th>Status</th>
      <th>Level</th>
      <th>Actions</th>
    </tr>
  `;

  applications.forEach((app) => {
    const tr = document.createElement('tr');

    const det = detectives.find(d => d.national_id === app.detectiveId);

    tr.innerHTML = `
      <td>${app.application_id}</td>
      <td>${app.detectiveId}</td>
      <td>${det ? `${det.first_name} ${det.last_name}` : '—'}</td>
      <td>${app.date}</td>
      <td>${app.status}</td>
    `;

    const tdSelect = document.createElement('td');
    const tdActions = document.createElement('td');

    if (app.status === 'pending') {
      const select = document.createElement('select');
      const placeholder = document.createElement('option');
        placeholder.textContent = 'Select level';
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
      levels.forEach((l) => {
        const opt = document.createElement('option');
        opt.value = l.level;
        opt.textContent = `Level ${l.level}`;
        select.appendChild(opt);
      });

      const approveBtn = document.createElement('button');
      approveBtn.type = 'button';
      approveBtn.textContent = 'Approve';
      approveBtn.className = 'primary-button';
      approveBtn.style.marginRight = '0.4rem';

     approveBtn.onclick = async () => {
        const selectedLevel = Number(select.value);

        if (!selectedLevel) {
            alert('You must select a level before approving.');
            return;
        }

        await approveApplication(app.application_id, selectedLevel);
        await loadApproval(container);
        };


      const rejectBtn = document.createElement('button');
      rejectBtn.type = 'button';
      rejectBtn.textContent = 'Reject';
      rejectBtn.className = 'nav-button';

      rejectBtn.onclick = async () => {
        await rejectApplication(app.application_id);
        await loadApproval(container); // stay on same view
      };

      tdSelect.appendChild(select);
      tdActions.appendChild(approveBtn);
      tdActions.appendChild(rejectBtn);
    } else {
      tdSelect.textContent = '—';
      tdActions.textContent = '—';
    }

    tr.append(tdSelect, tdActions);
    table.appendChild(tr);
  });

  section.appendChild(table);
  container.appendChild(section);
}
