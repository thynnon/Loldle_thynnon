// État du jeu
let champions = [];
let mysteryChampion = null;
let currentQuote = null;
let attempts = 0;
let maxAttempts = 3;
let gameOver = false;
let hintsRevealed = 0;
let selectedChampions = [];
let stats = {
  played: 0,
  won: 0,
  streak: 0
};

// Éléments DOM
const quoteText = document.getElementById('quoteText');
const attemptsDisplay = document.getElementById('attemptsDisplay');
const resultMessage = document.getElementById('resultMessage');
const celebration = document.getElementById('celebration');
const hintButton = document.getElementById('hintButton');
const revealedHints = document.getElementById('revealedHints');
const statsBtn = document.getElementById('statsBtn');
const statsModal = document.getElementById('statsModal');
const closeStatsBtn = document.getElementById('closeStatsBtn');
const newGameBtn = document.getElementById('newGameBtn');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');

// Charger les champions
async function loadChampions() {
  try {
    const response = await fetch('script/champions.json');
    champions = await response.json();
    // Filtrer uniquement les champions avec des citations
    champions = champions.filter(c => c.citations && c.citations.length > 0);
    init();
  } catch (error) {
    console.error('Erreur lors du chargement des champions:', error);
    quoteText.textContent = 'Erreur de chargement. Veuillez rafraîchir la page.';
  }
}

// Initialiser le jeu
function init() {
  loadStats();
  startNewGame();
  setupEventListeners();
}

// Nouvelle partie
function startNewGame() {
  // Choisir un champion aléatoire avec des citations
  mysteryChampion = champions[Math.floor(Math.random() * champions.length)];
  
  // Choisir une citation aléatoire
  const quoteIndex = Math.floor(Math.random() * mysteryChampion.citations.length);
  currentQuote = mysteryChampion.citations[quoteIndex];
  
  console.log('Champion mystère:', mysteryChampion.nom);
  
  attempts = 0;
  gameOver = false;
  hintsRevealed = 0;
  selectedChampions = [];
  
  quoteText.textContent = `"${currentQuote}"`;
  
  updateAttempts();
  
  resultMessage.classList.add('hidden');
  revealedHints.innerHTML = '';
  hintButton.disabled = false;
  searchInput.value = '';
  searchInput.disabled = false;
  searchSuggestions.classList.add('hidden');
}

// Créer la grille de champions (fonction désactivée mais conservée pour compatibilité)
function createChampionsGrid() {
  // Fonction désactivée - la sélection se fait maintenant uniquement via la recherche
}

// Sélectionner un champion
function selectChampion(championName) {
  if (gameOver) return;
  
  // Vérifier si le champion a déjà été tenté
  if (selectedChampions.includes(championName)) return;
  
  attempts++;
  selectedChampions.push(championName);
  updateAttempts();
  
  if (championName === mysteryChampion.nom) {
    // Victoire !
    showResult(true);
  } else {
    // Mauvaise réponse
    if (attempts >= maxAttempts) {
      // Défaite
      showResult(false);
    }
  }
}

// Révéler un indice
function revealHint() {
  if (gameOver || hintsRevealed >= 3) return;
  
  attempts++;
  hintsRevealed++;
  updateAttempts();
  
  const hints = [
    { label: 'Genre', value: mysteryChampion.genre },
    { label: 'Région', value: Array.isArray(mysteryChampion.region) ? mysteryChampion.region[0] : mysteryChampion.region },
    { label: 'Rôle', value: Array.isArray(mysteryChampion.roles) ? mysteryChampion.roles[0] : mysteryChampion.roles }
  ];
  
  const hint = hints[hintsRevealed - 1];
  const badge = document.createElement('div');
  badge.className = 'hint-badge';
  badge.textContent = `${hint.label}: ${hint.value}`;
  revealedHints.appendChild(badge);
  
  if (hintsRevealed >= 3 || attempts >= maxAttempts) {
    hintButton.disabled = true;
  }
  
  if (attempts >= maxAttempts) {
    showResult(false);
  }
}

// Afficher le résultat
function showResult(won) {
  gameOver = true;
  hintButton.disabled = true;
  searchInput.disabled = true;
  searchSuggestions.classList.add('hidden');
  
  // Mettre à jour les stats
  stats.played++;
  if (won) {
    stats.won++;
    stats.streak++;
  } else {
    stats.streak = 0;
  }
  saveStats();
  
  // Afficher le message
  if (won) {
    resultMessage.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: 1rem;">
        🎉 BRAVO ! 🎉
      </div>
      <img src="${mysteryChampion.icon}" alt="${mysteryChampion.nom}" class="win-icon">
      <div style="font-size: 1.8rem; font-weight: bold; margin: 1rem 0;">
        ${mysteryChampion.nom}
      </div>
      <div style="font-size: 1.1rem; color: #a09b8c;">
        Trouvé en ${attempts} essai${attempts > 1 ? 's' : ''} !
      </div>
    `;
    
    celebration.classList.remove('hidden');
    setTimeout(() => celebration.classList.add('hidden'), 1500);
  } else {
    resultMessage.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: 1rem;">
        😔 Dommage !
      </div>
      <img src="${mysteryChampion.icon}" alt="${mysteryChampion.nom}" class="win-icon">
      <div style="font-size: 1.8rem; font-weight: bold; margin: 1rem 0;">
        C'était ${mysteryChampion.nom}
      </div>
      <div style="font-size: 1.1rem; color: #a09b8c;">
        Essaie encore !
      </div>
    `;
  }
  
  resultMessage.classList.remove('hidden');
}

// Mettre à jour l'affichage des tentatives
function updateAttempts() {
  attemptsDisplay.textContent = `Essais: ${attempts}/${maxAttempts}`;
}

// Configuration des écouteurs
function setupEventListeners() {
  hintButton.addEventListener('click', revealHint);
  newGameBtn.addEventListener('click', startNewGame);
  
  // Barre de recherche
  searchInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase().trim();
    
    if (value.length === 0 || gameOver) {
      searchSuggestions.classList.add('hidden');
      return;
    }

    const filtered = champions.filter(c => 
      c.nom.toLowerCase().includes(value) && 
      !selectedChampions.includes(c.nom)
    );

    if (filtered.length > 0) {
      searchSuggestions.innerHTML = filtered.map(c => {
        const isDisabled = selectedChampions.includes(c.nom);
        return `
          <div class="suggestion-item ${isDisabled ? 'disabled' : ''}" data-champion="${c.nom}">
            <img src="${c.icon}" alt="${c.nom}" class="suggestion-icon">
            <span class="suggestion-name">${c.nom}</span>
          </div>
        `;
      }).join('');
      searchSuggestions.classList.remove('hidden');

      document.querySelectorAll('.suggestion-item').forEach(item => {
        if (!item.classList.contains('disabled')) {
          item.addEventListener('click', () => {
            selectChampion(item.dataset.champion);
            searchInput.value = '';
            searchSuggestions.classList.add('hidden');
          });
        }
      });
    } else {
      searchSuggestions.classList.add('hidden');
    }
  });

  // Entrée avec clavier
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !gameOver) {
      const firstSuggestion = document.querySelector('.suggestion-item:not(.disabled)');
      if (firstSuggestion) {
        selectChampion(firstSuggestion.dataset.champion);
        searchInput.value = '';
        searchSuggestions.classList.add('hidden');
      }
    }
  });

  // Clic à l'extérieur
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchSuggestions.classList.add('hidden');
    }
  });
  
  statsBtn.addEventListener('click', () => {
    displayStats();
    statsModal.classList.remove('hidden');
  });
  
  closeStatsBtn.addEventListener('click', () => {
    statsModal.classList.add('hidden');
  });
  
  statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) {
      statsModal.classList.add('hidden');
    }
  });
}

// Gestion des stats
function loadStats() {
  const saved = localStorage.getItem('loldle_citations_stats');
  if (saved) {
    stats = JSON.parse(saved);
  }
}

function saveStats() {
  localStorage.setItem('loldle_citations_stats', JSON.stringify(stats));
}

function displayStats() {
  document.getElementById('statsPlayed').textContent = stats.played;
  document.getElementById('statsWon').textContent = stats.won;
  document.getElementById('statsStreak').textContent = stats.streak;
  
  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  document.getElementById('winRate').textContent = `${winRate}%`;
}

// Démarrer le jeu
window.addEventListener('load', loadChampions);