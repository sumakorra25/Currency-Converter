const currencyList = document.getElementById('currencyList');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const amountInput = document.getElementById('amountInput');
const convertBtn = document.getElementById('convertBtn');
const resultBox = document.getElementById('convertedValue');
const conversionMeta = document.getElementById('conversionMeta');
const apiStatus = document.getElementById('api-status');
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

const formatMoney = (value) => new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

async function loadCurrencies() {
  try {
    const response = await fetch('/api/currencies');
    if (!response.ok) {
      throw new Error('Unable to load currencies');
    }

    const currencies = await response.json();
    const entries = Object.values(currencies).sort((a, b) => a.name.localeCompare(b.name));

    fromCurrency.innerHTML = '';
    toCurrency.innerHTML = '';

    entries.forEach((currency) => {
      const optionFrom = document.createElement('option');
      const optionTo = document.createElement('option');
      optionFrom.value = currency.code;
      optionTo.value = currency.code;
      optionFrom.textContent = `${currency.code} - ${currency.name}`;
      optionTo.textContent = `${currency.code} - ${currency.name}`;

      if (currency.code === 'USD') {
        optionFrom.selected = true;
      }
      if (currency.code === 'INR') {
        optionTo.selected = true;
      }

      fromCurrency.appendChild(optionFrom);
      toCurrency.appendChild(optionTo);
    });

    const listMarkup = entries.slice(0, 24).map((currency) => `
      <div class="currency-pill">
        <span>${currency.code}</span>
        <small>${currency.name}</small>
      </div>
    `).join('');

    currencyList.innerHTML = listMarkup;
    apiStatus.textContent = 'Live';
    apiStatus.style.color = '#18835d';
    apiStatus.style.background = '#e9f8f2';
  } catch (error) {
    apiStatus.textContent = 'Offline';
    apiStatus.style.color = '#b73737';
    apiStatus.style.background = '#fff0f0';
    conversionMeta.textContent = 'The currency service is unavailable right now.';
    console.error(error);
  }
}

async function convertCurrency() {
  const from = fromCurrency.value;
  const to = toCurrency.value;
  const amount = Number(amountInput.value);

  if (!from || !to || !amount || amount <= 0) {
    resultBox.textContent = 'Invalid input';
    conversionMeta.textContent = 'Please enter a valid amount greater than zero.';
    return;
  }

  try {
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';

    const response = await fetch(`/api/convert?from=${from}&to=${to}&amount=${amount}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Conversion failed');
    }

    resultBox.textContent = `${data.result.toFixed(2)} ${data.to}`;
    conversionMeta.textContent = `1 ${data.from} = ${data.rate.toFixed(4)} ${data.to}`;
  } catch (error) {
    resultBox.textContent = 'Error';
    conversionMeta.textContent = error.message;
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = 'Convert';
  }
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  registerMessage.classList.add('hidden');
  registerMessage.classList.remove('success', 'error');

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    registerMessage.textContent = `Success! ${data.user.name} is registered.`;
    registerMessage.classList.remove('hidden');
    registerMessage.classList.add('success');
    registerForm.reset();
  } catch (error) {
    registerMessage.textContent = error.message;
    registerMessage.classList.remove('hidden');
    registerMessage.classList.add('error');
  }
});

convertBtn.addEventListener('click', convertCurrency);

loadCurrencies();
