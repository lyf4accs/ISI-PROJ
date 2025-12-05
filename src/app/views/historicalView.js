// src/app/views/historicalView.js
import { createElement } from '../../ui/dom.js';
import { getDb } from '../../core/api.js';

export function renderHistoricalView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', { className: 'card-title', text: 'Historical applications' });
  const subtitle = createElement('p', {
    className: 'card-subtitle',
    text: 'All applications stored in the SIGED database (read-only).',
  });

  const container = createElement('div', {});
  container.textContent = 'Loading historical data...';

  card.append(title, subtitle, container);
  root.appendChild(card);

  loadHistorical(container);
}

async function loadHistorical(container) {
  try {
    const db = await getDb();
    const { detectives = [], applications = [] } = db;

    if (!applications.length) {
      container.textContent = 'No applications registered yet.';
      return;
    }

    container.innerHTML = '';

    // Filter controls
    const filterWrapper = document.createElement('div');
    filterWrapper.style.marginBottom = '0.75rem';

    const label = document.createElement('label');
    label.textContent = 'Filter: ';
    label.style.marginRight = '0.5rem';

    const select = document.createElement('select');
    const optAll = new Option('All applications', 'all');
    const optApproved = new Option('Approved only', 'approved');

    select.appendChild(optAll);
    select.appendChild(optApproved);

    filterWrapper.appendChild(label);
    filterWrapper.appendChild(select);

    const tableContainer = document.createElement('div');

    container.appendChild(filterWrapper);
    container.appendChild(tableContainer);

    const renderTable = (mode) => {
      tableContainer.innerHTML = '';

      const filtered =
        mode === 'approved'
          ? applications.filter(a => a.status === 'approved')
          : applications;

      if (!filtered.length) {
        tableContainer.textContent =
          mode === 'approved'
            ? 'No approved applications yet.'
            : 'No applications found.';
        return;
      }

      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginTop = '0.5rem';
      table.innerHTML = `
        <thead>
          <tr>
            <th style="border-bottom:1px solid #e5e7eb;padding:0.5rem;text-align:left;">Application ID</th>
            <th style="border-bottom:1px solid #e5e7eb;padding:0.5rem;text-align:left;">National ID</th>
            <th style="border-bottom:1px solid #e5e7eb;padding:0.5rem;text-align:left;">Name</th>
            <th style="border-bottom:1px solid #e5e7eb;padding:0.5rem;text-align:left;">Date</th>
            <th style="border-bottom:1px solid #e5e7eb;padding:0.5rem;text-align:left;">Status</th>
            <th style="border-bottom:1px solid #e5e7eb;padding:0.5rem;text-align:left;">Equipment</th>
            <th style="border-bottom:1px solid #e5e7eb;padding:0.5rem;text-align:left;">CV</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector('tbody');

      filtered.forEach((app) => {
        const det = detectives.find((d) => d.national_id === app.detectiveId);
        const tr = document.createElement('tr');

       const td = (text, max = 40) => {
  const cell = document.createElement('td');
  cell.style.padding = '0.4rem';
  cell.style.borderBottom = '1px solid #f3f4f6';

  const str = String(text);
  cell.textContent = str.length > max ? str.slice(0, max) + '...' : str;

  return cell;
};



        tr.append(
          td(String(app.application_id)),
          td(app.detectiveId),
          td(det ? `${det.first_name} ${det.last_name}` : '—'),
          td(app.date),
          td(app.status || 'pending'),
         td(app.equipment, 20),
td(app.cv, 20),

        );

        tbody.appendChild(tr);
      });

      tableContainer.appendChild(table);
    };

    // initial render
    renderTable('all');

    select.addEventListener('change', () => {
      renderTable(select.value);
    });
  } catch (err) {
    console.error(err);
    container.textContent = 'Error loading historical data.';
  }
}
