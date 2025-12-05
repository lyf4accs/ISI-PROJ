// src/app/views/promotionsView.js
import { createElement } from '../../ui/dom.js';
import { getDb, getLevels, promoteDetective } from '../../core/api.js';

/**
 * @typedef {Object} Detective
 * @property {string} national_id
 * @property {string} first_name
 * @property {string} last_name
 * @property {number | null} level
 */

/**
 * Render the promotions view.
 * @param {HTMLElement} root
 */
export function renderPromotionsView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', {
    className: 'card-title',
    text: 'Promote Detectives',
  });
  const subtitle = createElement('p', {
    className: 'card-subtitle',
    text: 'Record promotions for detectives (upward only).',
  });

  const container = createElement('div', {});
  container.textContent = 'Loading detectives...';

  card.append(title, subtitle, container);
  root.appendChild(card);

  loadPromotions(container);
}

/**
 * Load and render promotions table.
 * @param {HTMLElement} container
 */
async function loadPromotions(container) {
  const db = await getDb();
  const levels = await getLevels();

  /** @type {Detective[]} */
  const detectives = db.detectives || [];

  const maxLevel = levels.length
    ? Math.max(
        ...levels.map(
          /** @param {{ level: number }} l */ (l) => l.level
        )
      )
    : 4;

  const eligible = detectives.filter(
    /** @param {Detective} d */ (d) => d.level !== null && d.level < maxLevel
  );

  container.innerHTML = '';

  if (!eligible.length) {
    container.textContent = 'No detectives available for promotion.';
    return;
  }

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '1rem';

  table.innerHTML = `
    <tr>
      <th>DNI</th>
      <th>Name</th>
      <th>Current Level</th>
      <th>Promote To</th>
      <th>Action</th>
    </tr>
  `;

  eligible.forEach(
    /** @param {Detective} d */ (d) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${d.national_id}</td>
        <td>${d.first_name} ${d.last_name}</td>
        <td>${d.level}</td>
      `;

      const select = document.createElement('select');
      for (let level = (d.level || 0) + 1; level <= maxLevel; level++) {
        const opt = document.createElement('option');
        opt.value = String(level);
        opt.textContent = `Level ${level}`;
        select.appendChild(opt);
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Promote';
      btn.className = 'primary-button';

      btn.onclick = async () => {
        await promoteDetective(d.national_id, Number(select.value));
        await loadPromotions(container); // stay on same view
      };

      const tdSelect = document.createElement('td');
      const tdAction = document.createElement('td');
      tdSelect.appendChild(select);
      tdAction.appendChild(btn);

      tr.append(tdSelect, tdAction);
      table.appendChild(tr);
    }
  );

  container.appendChild(table);
}
