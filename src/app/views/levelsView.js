// src/app/views/levelsView.js
import { createElement } from '../../ui/dom.js';
import { getLevels, updateLevelPrice } from '../../core/api.js';

export function renderLevelsView(root) {
  root.innerHTML = '';

  const card = createElement('section', { className: 'card' });
  const title = createElement('h2', {
    className: 'card-title',
    text: 'Manage Levels',
  });
  const subtitle = createElement('p', {
    className: 'card-subtitle',
    text: 'View and update the price per photograph for each level.',
  });

  const container = createElement('div', {});
  container.textContent = 'Loading levels...';

  card.append(title, subtitle, container);
  root.appendChild(card);

  loadLevels(container);
}

async function loadLevels(container) {
  const levels = await getLevels();
  container.innerHTML = '';

  if (!levels.length) {
    container.textContent = 'No levels configured.';
    return;
  }

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '1rem';

  table.innerHTML = `
    <tr>
      <th>Level</th>
      <th>Price / Photo</th>
      <th>Update</th>
    </tr>
  `;

  levels.forEach((l) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${l.level}</td>`;

    const input = document.createElement('input');
    input.type = 'number';
    input.value = l.price_per_photo;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Save';
    btn.className = 'primary-button';

    btn.onclick = async () => {
      await updateLevelPrice(l.level, Number(input.value));
      // stay on this view, maybe just a small UX note:
      // alert('Price updated');
    };

    const tdPrice = document.createElement('td');
    const tdAction = document.createElement('td');
    tdPrice.appendChild(input);
    tdAction.appendChild(btn);

    tr.append(tdPrice, tdAction);
    table.appendChild(tr);
  });

  container.appendChild(table);
}
