const accessForm = document.querySelector('#accessForm');
const accessCode = document.querySelector('#accessCode');
const loginCard = document.querySelector('#loginCard');
const wishesPanel = document.querySelector('#wishesPanel');
const wishList = document.querySelector('#wishList');
const emptyState = document.querySelector('#emptyState');
const status = document.querySelector('#status');
const refreshButton = document.querySelector('#refreshButton');

let activeCode = '';

function formatDate(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul'
  }).format(new Date(value));
}

function renderWishes(wishes) {
  wishList.replaceChildren();
  emptyState.hidden = wishes.length !== 0;

  wishes.forEach(wish => {
    const article = document.createElement('article');
    article.className = 'wish';

    const message = document.createElement('p');
    message.textContent = wish.message;

    const time = document.createElement('time');
    time.dateTime = wish.created_at;
    time.textContent = formatDate(wish.created_at);

    article.append(message, time);
    wishList.append(article);
  });
}

async function loadWishes(code) {
  const { url, key } = window.SUPABASE_CONFIG;
  const response = await fetch(`${url}/rest/v1/rpc/get_wishes`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ access_code: code })
  });

  if (!response.ok) throw new Error('invalid-code');
  return response.json();
}

async function openBox(event) {
  event?.preventDefault();
  const code = accessCode.value.trim();
  const button = accessForm.querySelector('button');
  button.disabled = true;
  status.textContent = 'Dilek kutusu açılıyor…';

  try {
    const wishes = await loadWishes(code);
    activeCode = code;
    renderWishes(wishes);
    loginCard.hidden = true;
    wishesPanel.hidden = false;
  } catch (error) {
    status.textContent = 'Kod doğru değil veya bağlantı kurulamadı.';
  } finally {
    button.disabled = false;
  }
}

accessForm.addEventListener('submit', openBox);
refreshButton.addEventListener('click', async () => {
  refreshButton.disabled = true;
  try {
    renderWishes(await loadWishes(activeCode));
  } finally {
    refreshButton.disabled = false;
  }
});
