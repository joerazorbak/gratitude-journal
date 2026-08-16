const form = document.getElementById('journal-form');
const entriesList = document.getElementById('entries-list');
const gratitudeList = document.getElementById('gratitude-list');
const clearBtn = document.getElementById('clear-btn');
const dateInput = document.getElementById('entry-date');
const dailyPrompt = document.getElementById('daily-prompt');
const todayBadge = document.getElementById('today-badge');
const entriesCount = document.getElementById('entries-count');
const weekCount = document.getElementById('week-count');
const dominantMood = document.getElementById('dominant-mood');
const streakCount = document.getElementById('streak-count');
const installBtn = document.getElementById('install-btn');
const installNote = document.getElementById('install-note');
const submitBtn = document.getElementById('submit-btn');
const appShell = document.getElementById('app-shell');
const welcomeScreen = document.getElementById('welcome-screen');
const welcomeForm = document.getElementById('welcome-form');
const userNameInput = document.getElementById('user-name');
const userGreeting = document.getElementById('user-greeting');

const STORAGE_KEY = 'mon-journal-de-gratitude';
const PROMPT_STATE_KEY = 'mon-journal-de-gratitude-prompt-state';
const USER_NAME_KEY = 'mon-journal-de-gratitude-user-name';

let deferredPrompt = null;
let editingEntryIndex = null;

const promptLibrary = [
  'Réfléchis à ta journée avec ces cinq questions simples : ce qui te rend fier·e, ce que tu as bien fait, les moments positifs, ce qui aurait pu être meilleur et ton objectif pour demain.',
  'Fais le point sur ta journée avec honnêteté et douceur : ce qui s’est bien passé, ce qui a été positif, et ce que tu veux améliorer demain.',
  'Prends un moment pour observer ta journée : quelles réussites, quels bienfaits, et quel but te fera avancer demain ?',
  'Journal quotidien : note ce qui a été bon, ce qui t’a grandi, ce que tu peux améliorer et ce que tu veux viser demain.'
];

function getStorage() {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function getEntries() {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    const storedEntries = storage.getItem(STORAGE_KEY);
    return storedEntries ? JSON.parse(storedEntries) : [];
  } catch (error) {
    return [];
  }
}

function saveEntries(entries) {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    return false;
  }
}

function getUserName() {
  const storage = getStorage();

  if (!storage) {
    return '';
  }

  try {
    return storage.getItem(USER_NAME_KEY) || '';
  } catch (error) {
    return '';
  }
}

function saveUserName(name) {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(USER_NAME_KEY, name);
    return true;
  } catch (error) {
    return false;
  }
}

function showMainApp(name) {
  if (appShell) {
    appShell.classList.remove('hidden');
  }

  if (welcomeScreen) {
    welcomeScreen.classList.add('hidden');
  }

  if (userGreeting) {
    userGreeting.textContent = `Bienvenue, ${name}`;
    userGreeting.classList.remove('hidden');
  }
}

function initOnboarding() {
  const savedName = getUserName();

  if (!savedName) {
    if (appShell) {
      appShell.classList.add('hidden');
    }

    if (welcomeScreen) {
      welcomeScreen.classList.remove('hidden');
    }

    return;
  }

  showMainApp(savedName);
}

function getTodayIso() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateString) {
  if (!dateString) return 'Aujourd’hui';

  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getMoodLabel(moodValue) {
  return {
    joyeux: 'Joyeux',
    heureux: 'Heureux',
    calme: 'Calme',
    serein: 'Serein',
    motivé: 'Motivé',
    optimiste: 'Optimiste',
    fatigué: 'Fatigué',
    stressé: 'Stressé',
    triste: 'Triste',
    anxieux: 'Anxieux',
    épuisé: 'Épuisé',
    énervé: 'Énervé',
  }[moodValue] || 'Heureux';
}

function getPromptIndexForDate(dateString) {
  const seed = `${dateString || getTodayIso()}-${Date.now()}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % promptLibrary.length;
}

function getCurrentPrompt(dateString = getTodayIso()) {
  return promptLibrary[getPromptIndexForDate(dateString)];
}

function renderPrompt(dateString = getTodayIso()) {
  const promptText = getCurrentPrompt(dateString);

  if (dailyPrompt) {
    dailyPrompt.textContent = promptText;
  }

  if (todayBadge) {
    todayBadge.textContent = formatDate(dateString || getTodayIso());
  }
}

function getConsecutiveEntryCount(entries) {
  const uniqueDates = [...new Set(
    entries
      .map((entry) => (entry.date || '').trim())
      .filter(Boolean)
  )].sort((a, b) => new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00'));

  if (!uniqueDates.length) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date(uniqueDates[0] + 'T00:00:00');

  while (true) {
    const iso = cursor.toISOString().split('T')[0];
    if (!uniqueDates.includes(iso)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function updateSummary() {
  const entries = getEntries();
  const totalEntries = entries.length;
  const today = new Date();
  const startWeek = new Date(today);
  startWeek.setDate(today.getDate() - 6);

  const recentWeekEntries = entries.filter((entry) => {
    if (!entry.date) return false;
    const entryDate = new Date(entry.date + 'T00:00:00');
    return entryDate >= startWeek && entryDate <= today;
  }).length;

  const moodCounts = {};
  entries.forEach((entry) => {
    const mood = getMoodLabel(entry.mood || 'heureux');
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });

  const dominant = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  if (entriesCount) {
    entriesCount.textContent = String(totalEntries);
  }

  if (weekCount) {
    weekCount.textContent = String(recentWeekEntries);
  }

  if (dominantMood) {
    dominantMood.textContent = dominant ? dominant[0] : '—';
  }

  if (streakCount) {
    streakCount.textContent = String(getConsecutiveEntryCount(entries));
  }
}

function renderGratitudeList() {
  const entries = getEntries();
  const gratitudeItems = entries
    .flatMap((entry) => [
      { text: entry.proud1, date: entry.date },
      { text: entry.proud2, date: entry.date },
      { text: entry.proud3, date: entry.date },
      { text: entry.done1, date: entry.date },
      { text: entry.done2, date: entry.date },
      { text: entry.done3, date: entry.date },
      { text: entry.positive1, date: entry.date },
      { text: entry.positive2, date: entry.date },
      { text: entry.positive3, date: entry.date },
    ])
    .filter((item) => item.text && item.text.trim());

  if (!gratitudeItems.length) {
    gratitudeList.innerHTML = '<li class="empty-state">Aucune réflexion enregistrée pour le moment.</li>';
    return;
  }

  gratitudeList.innerHTML = gratitudeItems
    .slice(0, 6)
    .map(
      (item) => `
        <li class="gratitude-item">
          <span class="gratitude-chip">journal</span>
          <p>${item.text}</p>
        </li>
      `
    )
    .join('');
}

function resetFormState() {
  editingEntryIndex = null;
  form.reset();
  if (submitBtn) {
    submitBtn.textContent = 'Enregistrer ma gratitude';
  }
  if (dateInput) {
    dateInput.value = getTodayIso();
    renderPrompt(dateInput.value);
  }
}

function renderEntries() {
  const entries = getEntries();

  if (!entries.length) {
    entriesList.innerHTML = '<li class="empty-state">Aucune entrée pour le moment. Commencez par ajouter votre journal du jour.</li>';
    updateSummary();
    renderGratitudeList();
    return;
  }

  entriesList.innerHTML = entries
    .map(
      (entry, index) => `
        <li class="entry-item">
          <h3>Journal du ${formatDate(entry.date)}</h3>
          <div class="entry-meta">${getMoodLabel(entry.mood || 'heureux')}</div>

          <div class="entry-section">
            <strong>1. Fierté</strong>
            <ul>
              ${[entry.proud1, entry.proud2, entry.proud3].filter(Boolean).map((item) => `<li>${item}</li>`).join('') || '<li>—</li>'}
            </ul>
          </div>

          <div class="entry-section">
            <strong>2. Bien fait</strong>
            <ul>
              ${[entry.done1, entry.done2, entry.done3].filter(Boolean).map((item) => `<li>${item}</li>`).join('') || '<li>—</li>'}
            </ul>
          </div>

          <div class="entry-section">
            <strong>3. Positifs</strong>
            <ul>
              ${[entry.positive1, entry.positive2, entry.positive3].filter(Boolean).map((item) => `<li>${item}</li>`).join('') || '<li>—</li>'}
            </ul>
          </div>

          ${entry.improvement ? `<div class="entry-section"><strong>4. Amélioration</strong><p>${entry.improvement}</p></div>` : ''}
          ${entry.goal ? `<div class="entry-section"><strong>5. Objectif de demain</strong><p>${entry.goal}</p></div>` : ''}

          <div class="entry-actions">
            <button type="button" class="edit-btn" data-action="edit" data-index="${index}">Modifier</button>
            <button type="button" class="delete-btn" data-action="delete" data-index="${index}">Supprimer</button>
          </div>
        </li>
      `
    )
    .join('');

  updateSummary();
  renderGratitudeList();
}

function populateFormForEdit(index) {
  const entries = getEntries();
  const entry = entries[index];

  if (!entry) {
    return;
  }

  editingEntryIndex = index;

  if (dateInput) {
    dateInput.value = entry.date || getTodayIso();
  }

  const mood = document.getElementById('mood');
  const proud = form.querySelectorAll('[name="proud1"], [name="proud2"], [name="proud3"]');
  const done = form.querySelectorAll('[name="done1"], [name="done2"], [name="done3"]');
  const positive = form.querySelectorAll('[name="positive1"], [name="positive2"], [name="positive3"]');
  const improvement = document.getElementById('improvement');
  const goal = document.getElementById('goal');

  const proudValues = [entry.proud1 || '', entry.proud2 || '', entry.proud3 || ''];
  const doneValues = [entry.done1 || '', entry.done2 || '', entry.done3 || ''];
  const positiveValues = [entry.positive1 || '', entry.positive2 || '', entry.positive3 || ''];

  proud.forEach((input, indexValue) => {
    input.value = proudValues[indexValue] || '';
  });

  done.forEach((input, indexValue) => {
    input.value = doneValues[indexValue] || '';
  });

  positive.forEach((input, indexValue) => {
    input.value = positiveValues[indexValue] || '';
  });

  if (mood) mood.value = entry.mood || 'heureux';
  if (improvement) improvement.value = entry.improvement || '';
  if (goal) goal.value = entry.goal || '';

  if (submitBtn) {
    submitBtn.textContent = 'Mettre à jour';
  }
}

function updateInstallButtonState() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  if (installBtn) {
    installBtn.classList.toggle('hidden', isStandalone || !deferredPrompt);
  }

  if (installNote) {
    installNote.classList.toggle('hidden', isStandalone || !!deferredPrompt);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const newEntry = {
    date: formData.get('date'),
    mood: formData.get('mood') || 'heureux',
    proud1: formData.get('proud1')?.toString().trim(),
    proud2: formData.get('proud2')?.toString().trim(),
    proud3: formData.get('proud3')?.toString().trim(),
    done1: formData.get('done1')?.toString().trim(),
    done2: formData.get('done2')?.toString().trim(),
    done3: formData.get('done3')?.toString().trim(),
    positive1: formData.get('positive1')?.toString().trim(),
    positive2: formData.get('positive2')?.toString().trim(),
    positive3: formData.get('positive3')?.toString().trim(),
    improvement: formData.get('improvement')?.toString().trim() || '',
    goal: formData.get('goal')?.toString().trim() || '',
  };

  if (!newEntry.date) {
    return;
  }

  const existingEntries = getEntries();

  if (editingEntryIndex !== null && editingEntryIndex >= 0 && editingEntryIndex < existingEntries.length) {
    existingEntries[editingEntryIndex] = newEntry;
  } else {
    existingEntries.unshift(newEntry);
  }

  if (!saveEntries(existingEntries)) {
    alert('Le stockage local n’est pas disponible sur ce navigateur. Essayez d’ouvrir la page dans un navigateur normal ou de la réouvrir en mode standard.');
    return;
  }

  resetFormState();
  renderEntries();
});

entriesList.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;

  const index = Number(target.dataset.index);
  const action = target.dataset.action;

  if (Number.isNaN(index)) return;

  if (action === 'delete') {
    const entries = getEntries();
    entries.splice(index, 1);
    saveEntries(entries);
    renderEntries();
    if (editingEntryIndex === index) {
      resetFormState();
    }
    return;
  }

  if (action === 'edit') {
    populateFormForEdit(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

clearBtn.addEventListener('click', () => {
  const storage = getStorage();

  if (storage) {
    storage.removeItem(STORAGE_KEY);
  }

  resetFormState();
  renderEntries();
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) {
    if (installNote) {
      installNote.textContent = 'Sur iPhone/iPad : ouvrez le menu Safari puis “Ajouter à l’écran d’accueil”. Sur Android : utilisez le menu du navigateur pour “Ajouter à l’écran d’accueil”.';
      installNote.classList.remove('hidden');
    }
    return;
  }

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  updateInstallButtonState();
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  updateInstallButtonState();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  updateInstallButtonState();
});

if (welcomeForm) {
  welcomeForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const enteredName = (userNameInput?.value || '').trim();

    if (!enteredName) {
      return;
    }

    saveUserName(enteredName);
    showMainApp(enteredName);
  });
}

if (dateInput) {
  dateInput.value = getTodayIso();
  dateInput.addEventListener('change', () => {
    renderPrompt(dateInput.value || getTodayIso());
  });
}

initOnboarding();
renderPrompt(dateInput ? dateInput.value || getTodayIso() : getTodayIso());
renderEntries();
updateInstallButtonState();
