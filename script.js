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
  'Inspiration : qu’est-ce qui a apporté un peu de douceur à ta journée aujourd’hui ?',
  'Inspiration : quel moment de la journée t’a permis de te sentir plus serein(e) ?',
  'Inspiration : quelle petite chose a ajouté de la lumière à ton parcours aujourd’hui ?',
  'Inspiration : qu’est-ce qui t’a aidé à te sentir soutenu(e) aujourd’hui ?',
  'Inspiration : quel détail simple de ta journée mérite d’être noté avec gratitude ?',
  'Inspiration : quelle personne, action ou beauté a rendu ta journée un peu plus belle ?',
  'Inspiration : qu’est-ce qui t’a donné envie de respirer plus profondément ?',
  'Inspiration : quel petit bonheur t’a rappelé que la vie peut être douce ?',
  'Inspiration : quelle qualité de toi a aidé à traverser cette journée avec plus de douceur ?',
  'Inspiration : qu’est-ce qui t’a touché sans que tu t’en rendes compte au départ ?',
  'Inspiration : quel geste de gentillesse t’a vraiment marqué aujourd’hui ?',
  'Inspiration : qu’est-ce que tu peux apprécier dans ta vie, même si c’est simple ?',
  'Inspiration : quelle ressource ou soutien t’a aidé à avancer avec plus de calme ?',
  'Inspiration : quel petit détail de ta journée a illuminé ton énergie ?',
  'Inspiration : qu’est-ce qui te rend fier(e) d’avoir traversé cette journée ?',
  'Inspiration : quelle expérience d’aujourd’hui te fait sentir plus vivant(e) ?',
  'Inspiration : quel moment de calme, de joie ou de sécurité veux-tu garder précieusement ?',
  'Inspiration : quel élément de ton environnement t’a fait du bien aujourd’hui ?',
  'Inspiration : quelle preuve de beauté ou de douceur as-tu remarquée aujourd’hui ?',
  'Inspiration : quelle petite victoire intérieure mérite d’être célébrée ?'
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
      { text: entry.gratitude1, date: entry.date },
      { text: entry.gratitude2, date: entry.date },
      { text: entry.gratitude3, date: entry.date },
    ])
    .filter((item) => item.text && item.text.trim());

  if (!gratitudeItems.length) {
    gratitudeList.innerHTML = '<li class="empty-state">Aucune gratitude enregistrée pour le moment.</li>';
    return;
  }

  gratitudeList.innerHTML = gratitudeItems
    .slice(0, 6)
    .map(
      (item) => `
        <li class="gratitude-item">
          <span class="gratitude-chip">gratitude</span>
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
    entriesList.innerHTML = '<li class="empty-state">Aucune entrée pour le moment. Commencez par ajouter une pensée de gratitude.</li>';
    updateSummary();
    renderGratitudeList();
    return;
  }

  entriesList.innerHTML = entries
    .map(
      (entry, index) => `
        <li class="entry-item">
          <h3>${entry.gratitude1}</h3>
          <div class="entry-meta">${formatDate(entry.date)} • ${getMoodLabel(entry.mood || 'heureux')}</div>
          <ul>
            <li>${entry.gratitude2}</li>
            <li>${entry.gratitude3}</li>
          </ul>
          ${entry.reflection ? `<p>${entry.reflection}</p>` : ''}
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

  const gratitude1 = document.getElementById('gratitude-1');
  const gratitude2 = document.getElementById('gratitude-2');
  const gratitude3 = document.getElementById('gratitude-3');
  const mood = document.getElementById('mood');
  const reflection = document.getElementById('reflection');

  if (gratitude1) gratitude1.value = entry.gratitude1 || '';
  if (gratitude2) gratitude2.value = entry.gratitude2 || '';
  if (gratitude3) gratitude3.value = entry.gratitude3 || '';
  if (mood) mood.value = entry.mood || 'heureux';
  if (reflection) reflection.value = entry.reflection || '';

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
    gratitude1: formData.get('gratitude1')?.toString().trim(),
    gratitude2: formData.get('gratitude2')?.toString().trim(),
    gratitude3: formData.get('gratitude3')?.toString().trim(),
    mood: formData.get('mood') || 'heureux',
    reflection: formData.get('reflection')?.toString().trim() || '',
  };

  if (!newEntry.date || !newEntry.gratitude1 || !newEntry.gratitude2 || !newEntry.gratitude3) {
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
