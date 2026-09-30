const token = localStorage.getItem('jwt_token');
const dashboardContent = document.getElementById('dashboardContent');
const userProfile = document.getElementById('userProfile');
const state = { conversionPage: 1, pairPage: 1 };

function showMessage(text, type = 'info') {
  dashboardContent.innerHTML = `
    <div class="message-box ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}">${text}</div>
  `;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

async function loadProfile() {
  try {
    const data = await fetchJson('/api/auth/me');
    userProfile.innerHTML = `
      <p><strong>Name:</strong> ${data.user.name}</p>
      <p><strong>Email:</strong> ${data.user.email}</p>
    `;
  } catch (error) {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  }
}

async function renderProfile() {
  try {
    const data = await fetchJson('/api/auth/me');
    dashboardContent.innerHTML = `
      <h3>Logged in user profile</h3>
      <div class="profile-card large">
        <p><strong>ID:</strong> ${data.user.id}</p>
        <p><strong>Name:</strong> ${data.user.name}</p>
        <p><strong>Email:</strong> ${data.user.email}</p>
      </div>
    `;
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

async function populateCurrencyOptions(targetIds = ['fromCurrency', 'toCurrency']) {
  try {
    const currencies = await fetchJson('/api/currencies');
    const entries = Object.values(currencies);

    targetIds.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;
      select.innerHTML = '';
      entries.forEach((currency) => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = `${currency.code} - ${currency.name}`;
        if (id === 'fromCurrency' && currency.code === 'USD') option.selected = true;
        if (id === 'toCurrency' && currency.code === 'INR') option.selected = true;
        select.appendChild(option);
      });
    });
  } catch (error) {
    showMessage('Unable to load currencies', 'error');
  }
}

function renderConvertForm() {
  dashboardContent.innerHTML = `
    <h3>Convert an amount</h3>
    <div class="stack-form">
      <label><span>From</span><select id="fromCurrency"></select></label>
      <label><span>To</span><select id="toCurrency"></select></label>
      <label><span>Amount</span><input id="amountInput" type="number" min="0.01" step="0.01" value="100" /></label>
      <button id="convertBtn" class="primary-btn">Convert</button>
      <div id="convertResult" class="result-box small"></div>
    </div>
  `;

  populateCurrencyOptions();
  document.getElementById('convertBtn').addEventListener('click', async () => {
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    const amount = document.getElementById('amountInput').value;

    try {
      const data = await fetchJson(`/api/convert?from=${from}&to=${to}&amount=${amount}`);
      document.getElementById('convertResult').innerHTML = `
        <p class="result-label">Result</p>
        <h4>${data.result.toFixed(2)} ${data.to}</h4>
        <p>Rate: 1 ${data.from} = ${data.rate.toFixed(4)} ${data.to}</p>
      `;
    } catch (error) {
      showMessage(error.message, 'error');
    }
  });
}

async function renderRates() {
  try {
    const data = await fetchJson('/api/rates/latest?base=USD');
    const items = Object.entries(data.rates).slice(0, 12).map(([code, value]) => `
      <div class="mini-card"><strong>${code}</strong><span>${Number(value).toFixed(4)}</span></div>
    `).join('');

    dashboardContent.innerHTML = `
      <h3>Latest exchange rates</h3>
      <div class="mini-grid">${items}</div>
    `;
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

async function renderCurrencies() {
  try {
    const currencies = await fetchJson('/api/currencies');
    const items = Object.values(currencies).map((currency) => `
      <div class="currency-pill"><span>${currency.code}</span><small>${currency.name}</small></div>
    `).join('');

    dashboardContent.innerHTML = `
      <h3>Supported currency list</h3>
      <div class="currency-list">${items}</div>
    `;
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function renderCreateConversionForm() {
  dashboardContent.innerHTML = `
    <h3>Create a new conversion</h3>
    <form id="createConversionForm" class="stack-form">
      <label><span>From</span><select id="newFromCurrency"></select></label>
      <label><span>To</span><select id="newToCurrency"></select></label>
      <label><span>Amount</span><input id="newAmount" type="number" min="0.01" step="0.01" value="100" /></label>
      <button type="submit" class="primary-btn">Save conversion</button>
    </form>
    <div id="conversionMessage" class="message-box hidden"></div>
  `;

  populateCurrencyOptions(['newFromCurrency', 'newToCurrency']);
  document.getElementById('createConversionForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      from: document.getElementById('newFromCurrency').value,
      to: document.getElementById('newToCurrency').value,
      amount: document.getElementById('newAmount').value,
    };

    try {
      const data = await fetchJson('/api/conversions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const message = document.getElementById('conversionMessage');
      message.textContent = `Saved: ${data.from} → ${data.to} = ${data.result.toFixed(2)}`;
      message.classList.remove('hidden', 'error');
      message.classList.add('success');
    } catch (error) {
      const message = document.getElementById('conversionMessage');
      message.textContent = error.message;
      message.classList.remove('hidden', 'success');
      message.classList.add('error');
    }
  });
}

async function renderConversions(page = state.conversionPage) {
  try {
    const data = await fetchJson(`/api/conversions?page=${page}&limit=5`);
    const rows = data.data.length ? data.data.map((item) => `
      <tr>
        <td>${item.from}</td>
        <td>${item.to}</td>
        <td>${item.amount}</td>
        <td>${item.result.toFixed(2)}</td>
        <td><button class="small-btn" data-action="view-conversion" data-id="${item._id}">View</button></td>
        <td><button class="small-btn" data-action="edit-conversion" data-id="${item._id}">Update</button></td>
        <td><button class="small-btn danger" data-action="delete-conversion" data-id="${item._id}">Delete</button></td>
      </tr>
    `).join('') : '<tr><td colspan="7">No conversions found.</td></tr>';

    dashboardContent.innerHTML = `
      <h3>List all conversions</h3>
      <table class="data-table">
        <thead><tr><th>From</th><th>To</th><th>Amount</th><th>Result</th><th>View</th><th>Update</th><th>Delete</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="pager">
        <button class="secondary-btn" data-page="prev-conversion" ${page <= 1 ? 'disabled' : ''}>Previous</button>
        <span>Page ${page}</span>
        <button class="secondary-btn" data-page="next-conversion" ${page >= data.totalPages ? 'disabled' : ''}>Next</button>
      </div>
    `;

    dashboardContent.querySelector('[data-page="prev-conversion"]')?.addEventListener('click', () => {
      if (page > 1) {
        state.conversionPage -= 1;
        renderConversions(state.conversionPage);
      }
    });

    dashboardContent.querySelector('[data-page="next-conversion"]')?.addEventListener('click', () => {
      if (page < data.totalPages) {
        state.conversionPage += 1;
        renderConversions(state.conversionPage);
      }
    });

    dashboardContent.querySelectorAll('[data-action="view-conversion"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const conversion = await fetchJson(`/api/conversions/${button.dataset.id}`);
        showMessage(`Conversion: ${conversion.from} → ${conversion.to} | Amount: ${conversion.amount} | Result: ${conversion.result.toFixed(2)}`, 'success');
      });
    });

    dashboardContent.querySelectorAll('[data-action="edit-conversion"]').forEach((button) => {
      button.addEventListener('click', async () => {
        renderUpdateConversionForm(button.dataset.id);
      });
    });

    dashboardContent.querySelectorAll('[data-action="delete-conversion"]').forEach((button) => {
      button.addEventListener('click', async () => {
        await fetchJson(`/api/conversions/${button.dataset.id}`, { method: 'DELETE' });
        renderConversions(state.conversionPage);
      });
    });
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function renderUpdateConversionForm(id) {
  dashboardContent.innerHTML = `
    <h3>Update conversion</h3>
    <form id="updateConversionForm" class="stack-form">
      <label><span>From</span><select id="updateFromCurrency"></select></label>
      <label><span>To</span><select id="updateToCurrency"></select></label>
      <label><span>Amount</span><input id="updateAmount" type="number" min="0.01" step="0.01" /></label>
      <button type="submit" class="primary-btn">Update</button>
    </form>
    <div id="updateConversionMessage" class="message-box hidden"></div>
  `;

  populateCurrencyOptions(['updateFromCurrency', 'updateToCurrency']);
  fetchJson(`/api/conversions/${id}`).then((conversion) => {
    document.getElementById('updateAmount').value = conversion.amount;
    document.getElementById('updateFromCurrency').value = conversion.from;
    document.getElementById('updateToCurrency').value = conversion.to;
  });

  document.getElementById('updateConversionForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = {
        from: document.getElementById('updateFromCurrency').value,
        to: document.getElementById('updateToCurrency').value,
        amount: Number(document.getElementById('updateAmount').value),
      };
      const data = await fetchJson(`/api/conversions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const message = document.getElementById('updateConversionMessage');
      message.textContent = `Updated: ${data.from} → ${data.to} = ${data.result.toFixed(2)}`;
      message.classList.remove('hidden', 'error');
      message.classList.add('success');
    } catch (error) {
      const message = document.getElementById('updateConversionMessage');
      message.textContent = error.message;
      message.classList.remove('hidden', 'success');
      message.classList.add('error');
    }
  });
}

function renderCreatePairForm() {
  dashboardContent.innerHTML = `
    <h3>Create a new favourite pair</h3>
    <form id="createPairForm" class="stack-form">
      <label><span>From</span><select id="pairFromCurrency"></select></label>
      <label><span>To</span><select id="pairToCurrency"></select></label>
      <button type="submit" class="primary-btn">Save favourite pair</button>
    </form>
    <div id="pairMessage" class="message-box hidden"></div>
  `;

  populateCurrencyOptions(['pairFromCurrency', 'pairToCurrency']);
  document.getElementById('createPairForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = {
        from: document.getElementById('pairFromCurrency').value,
        to: document.getElementById('pairToCurrency').value,
      };
      const data = await fetchJson('/api/pairs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const message = document.getElementById('pairMessage');
      message.textContent = `Saved pair: ${data.from} → ${data.to}`;
      message.classList.remove('hidden', 'error');
      message.classList.add('success');
    } catch (error) {
      const message = document.getElementById('pairMessage');
      message.textContent = error.message;
      message.classList.remove('hidden', 'success');
      message.classList.add('error');
    }
  });
}

async function renderPairs(page = state.pairPage) {
  try {
    const data = await fetchJson(`/api/pairs?page=${page}&limit=5`);
    const rows = data.data.length ? data.data.map((item) => `
      <tr>
        <td>${item.from}</td>
        <td>${item.to}</td>
        <td><button class="small-btn" data-action="view-pair" data-id="${item._id}">View</button></td>
        <td><button class="small-btn" data-action="edit-pair" data-id="${item._id}">Update</button></td>
        <td><button class="small-btn danger" data-action="delete-pair" data-id="${item._id}">Delete</button></td>
      </tr>
    `).join('') : '<tr><td colspan="5">No favourite pairs found.</td></tr>';

    dashboardContent.innerHTML = `
      <h3>List all favourite pairs</h3>
      <table class="data-table">
        <thead><tr><th>From</th><th>To</th><th>View</th><th>Update</th><th>Delete</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="pager">
        <button class="secondary-btn" data-page="prev-pair" ${page <= 1 ? 'disabled' : ''}>Previous</button>
        <span>Page ${page}</span>
        <button class="secondary-btn" data-page="next-pair" ${page >= data.totalPages ? 'disabled' : ''}>Next</button>
      </div>
    `;

    dashboardContent.querySelector('[data-page="prev-pair"]')?.addEventListener('click', () => {
      if (page > 1) {
        state.pairPage -= 1;
        renderPairs(state.pairPage);
      }
    });

    dashboardContent.querySelector('[data-page="next-pair"]')?.addEventListener('click', () => {
      if (page < data.totalPages) {
        state.pairPage += 1;
        renderPairs(state.pairPage);
      }
    });

    dashboardContent.querySelectorAll('[data-action="view-pair"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const pair = await fetchJson(`/api/pairs/${button.dataset.id}`);
        showMessage(`Favourite pair: ${pair.from} → ${pair.to}`, 'success');
      });
    });

    dashboardContent.querySelectorAll('[data-action="edit-pair"]').forEach((button) => {
      button.addEventListener('click', async () => {
        renderUpdatePairForm(button.dataset.id);
      });
    });

    dashboardContent.querySelectorAll('[data-action="delete-pair"]').forEach((button) => {
      button.addEventListener('click', async () => {
        await fetchJson(`/api/pairs/${button.dataset.id}`, { method: 'DELETE' });
        renderPairs(state.pairPage);
      });
    });
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function renderUpdatePairForm(id) {
  dashboardContent.innerHTML = `
    <h3>Update favourite pair</h3>
    <form id="updatePairForm" class="stack-form">
      <label><span>From</span><select id="updatePairFrom"></select></label>
      <label><span>To</span><select id="updatePairTo"></select></label>
      <button type="submit" class="primary-btn">Update pair</button>
    </form>
    <div id="updatePairMessage" class="message-box hidden"></div>
  `;

  populateCurrencyOptions(['updatePairFrom', 'updatePairTo']);
  fetchJson(`/api/pairs/${id}`).then((pair) => {
    document.getElementById('updatePairFrom').value = pair.from;
    document.getElementById('updatePairTo').value = pair.to;
  });

  document.getElementById('updatePairForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = {
        from: document.getElementById('updatePairFrom').value,
        to: document.getElementById('updatePairTo').value,
      };
      const data = await fetchJson(`/api/pairs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const message = document.getElementById('updatePairMessage');
      message.textContent = `Updated pair: ${data.from} → ${data.to}`;
      message.classList.remove('hidden', 'error');
      message.classList.add('success');
    } catch (error) {
      const message = document.getElementById('updatePairMessage');
      message.textContent = error.message;
      message.classList.remove('hidden', 'success');
      message.classList.add('error');
    }
  });
}

async function renderMostConvertedPairs() {
  try {
    const data = await fetchJson('/api/conversions/stats');
    if (!data.length) {
      showMessage('No conversion history yet.', 'info');
      return;
    }

    const items = data.map((item) => `
      <div class="mini-card">
        <strong>${item.from} → ${item.to}</strong>
        <span>${item.count} conversions</span>
      </div>
    `).join('');

    dashboardContent.innerHTML = `
      <h3>Most converted pairs</h3>
      <div class="mini-grid">${items}</div>
    `;
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

async function handleTabChange(tab) {
  switch (tab) {
    case 'profile':
      renderProfile();
      break;
    case 'convert':
      renderConvertForm();
      break;
    case 'rates':
      renderRates();
      break;
    case 'currencies':
      renderCurrencies();
      break;
    case 'create-conversion':
      renderCreateConversionForm();
      break;
    case 'conversions':
      renderConversions();
      break;
    case 'create-pair':
      renderCreatePairForm();
      break;
    case 'pairs':
      renderPairs();
      break;
    case 'most-converted':
      renderMostConvertedPairs();
      break;
    default:
      renderProfile();
  }
}

document.querySelectorAll('[data-tab]').forEach((button) => {
  button.addEventListener('click', () => handleTabChange(button.dataset.tab));
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('jwt_token');
  window.location.href = '/login';
});

loadProfile();
handleTabChange('profile');
