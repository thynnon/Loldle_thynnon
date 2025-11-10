// État du jeu
let champions = [];
let championMystere = null;
let guessedChampions = [];
let gameOver = false;
let hintsUsed = 0;
let stats = {
  played: 0,
  won: 0,
  streak: 0
};

// Éléments DOM
const guessInput = document.getElementById('guessInput');
const suggestions = document.getElementById('suggestions');
const guessesHistory = document.getElementById('guessesHistory');
const attemptsDisplay = document.getElementById('attemptsDisplay');
const winMessage = document.getElementById('winMessage');
const celebration = document.getElementById('celebration');
const hintsSection = document.getElementById('hintsSection');
const hintsList = document.getElementById('hintsList');
const hintBtn = document.getElementById('hintBtn');
const hintBtnText = document.getElementById('hintBtnText');
const statsBtn = document.getElementById('statsBtn');
const statsModal = document.getElementById('statsModal');
const closeStatsBtn = document.getElementById('closeStatsBtn');
const newGameBtn = document.getElementById('newGameBtn');

// Charger les champions
async function chargerChampions() {
  try {
    const response = await fetch('./champions.json');
    champions = await response.json();
    init();
  } catch (error) {
    console.error('Erreur lors du chargement des champions:', error);
    // Champions de secours si le fichier n'existe pas
    champions = [
      { nom: "Ahri", genre: "Femme", roles: ["Mage", "Assassin"], especes: "Vastaya", ressource: "Mana", range: "Ranged", region: "Ionia", icon: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Ahri.png" },
      { nom: "Yasuo", genre: "Homme", roles: ["Fighter", "Assassin"], especes: "Humain", ressource: "Flow", range: "Melee", region: "Ionia", icon: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Yasuo.png" },
      { nom: "Lux", genre: "Femme", roles: ["Mage", "Support"], especes: "Humain", ressource: "Mana", range: "Ranged", region: "Demacia", icon: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Lux.png" },
      { nom: "Darius", genre: "Homme", roles: ["Fighter", "Tank"], especes: "Humain", ressource: "Mana", range: "Melee", region: "Noxus", icon: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Darius.png" },
      { nom: "Jinx", genre: "Femme", roles: ["Marksman"], especes: "Humain", ressource: "Mana", range: "Ranged", region: "Zaun", icon: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Jinx.png" },
      { nom: "Thresh", genre: "Homme", roles: ["Support", "Fighter"], especes: "Undead", ressource: "Mana", range: "Ranged", region: "Shadow Isles", icon: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Thresh.png" },
      { nom: "Zed", genre: "Homme", roles: ["Assassin"], especes: "Humain", ressource: "Energy", range: "Melee", region: "Ionia", icon: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Zed.png" },
      { nom: "Leona", genre: "Femme", roles: ["Tank", "Support"], especes: "Humain", ressource: "Mana", range: "Melee", region: "Targon", icon: "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Leona.png" }
    ];
    init();
  }
}

// Initialiser le jeu
function init() {
  loadStats();
  startNewGame();
  setupEventListeners();
}

// Commencer une nouvelle partie
function startNewGame() {
  championMystere = champions[Math.floor(Math.random() * champions.length)];
  console.log("Champion mystère :", championMystere.nom);
  
  guessedChampions = [];
  gameOver = false;
  hintsUsed = 0;
  
  guessesHistory.innerHTML = '';
  guessInput.value = '';
  guessInput.disabled = false;
  winMessage.classList.add('hidden');
  hintsSection.classList.add('hidden');
  hintsList.innerHTML = '';
  suggestions.classList.add('hidden');
  
  updateAttempts();
  updateHintButton();
}

// Configurer les écouteurs d'événements
function setupEventListeners() {
  // Input de recherche
  guessInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase().trim();
    
    if (value.length === 0) {
      suggestions.classList.add('hidden');
      return;
    }

    const filtered = champions.filter(c => 
      c.nom.toLowerCase().includes(value) && 
      !guessedChampions.find(g => g.nom === c.nom)
    );

    if (filtered.length > 0) {
      suggestions.innerHTML = filtered.map(c => `
        <div class="suggestion-item" data-champion="${c.nom}">
          <img src="${c.icon}" alt="${c.nom}" class="suggestion-icon">
          <span>${c.nom}</span>
        </div>
      `).join('');
      suggestions.classList.remove('hidden');

      document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => selectChampion(item.dataset.champion));
      });
    } else {
      suggestions.classList.add('hidden');
    }
  });

  // Entrée avec clavier
  guessInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstSuggestion = document.querySelector('.suggestion-item');
      if (firstSuggestion) {
        selectChampion(firstSuggestion.dataset.champion);
      }
    }
  });

  // Clic à l'extérieur
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      suggestions.classList.add('hidden');
    }
  });

  // Bouton d'indice
  hintBtn.addEventListener('click', showHint);

  // Bouton stats
  statsBtn.addEventListener('click', () => {
    displayStats();
    statsModal.classList.remove('hidden');
  });

  // Fermer modal stats
  closeStatsBtn.addEventListener('click', () => {
    statsModal.classList.add('hidden');
  });

  statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) {
      statsModal.classList.add('hidden');
    }
  });

  // Nouveau jeu
  newGameBtn.addEventListener('click', startNewGame);
}

// Sélectionner un champion
function selectChampion(championName) {
  if (gameOver) return;

  const champion = champions.find(c => c.nom === championName);
  if (!champion || guessedChampions.find(g => g.nom === championName)) return;

  guessedChampions.push(champion);
  guessInput.value = '';
  suggestions.classList.add('hidden');
  
  updateAttempts();
  addGuessRow(champion);

  if (champion.nom === championMystere.nom) {
    showWinMessage();
  }
}

// Mettre à jour le compteur de tentatives
function updateAttempts() {
  attemptsDisplay.textContent = `Tentatives: ${guessedChampions.length}`;
}

// Ajouter une ligne de tentative
function addGuessRow(champion) {
  const row = document.createElement('div');
  row.className = 'guess-row';

  const cells = [
    { 
      html: `<img src="${champion.icon}" alt="${champion.nom}" class="champ-icon"><div class="cell-value">${champion.nom}</div>`, 
      class: champion.nom === championMystere.nom ? 'correct' : 'incorrect'
    },
    { 
      html: `<div class="cell-value">${champion.genre}</div>`, 
      class: champion.genre === championMystere.genre ? 'correct' : 'incorrect'
    },
    { 
      html: `<div class="cell-value">${champion.roles.join(', ')}</div>`, 
      class: getRolesClass(champion.roles, championMystere.roles)
    },
    { 
      html: `<div class="cell-value">${champion.especes}</div>`, 
      class: champion.especes === championMystere.especes ? 'correct' : 'incorrect'
    },
    { 
      html: `<div class="cell-value">${champion.ressource}</div>`, 
      class: champion.ressource === championMystere.ressource ? 'correct' : 'incorrect'
    },
    { 
      html: `<div class="cell-value">${champion.range}</div>`, 
      class: champion.range === championMystere.range ? 'correct' : 'incorrect'
    },
    { 
      html: `<div class="cell-value">${champion.region}</div>`, 
      class: champion.region === championMystere.region ? 'correct' : 'incorrect'
    }
  ];

  cells.forEach(cell => {
    const cellDiv = document.createElement('div');
    cellDiv.className = `guess-cell ${cell.class}`;
    cellDiv.innerHTML = cell.html;
    row.appendChild(cellDiv);
  });

  guessesHistory.insertBefore(row, guessesHistory.firstChild);
}

// Déterminer la classe pour les rôles
function getRolesClass(champRoles, mystereRoles) {
  const hasCommon = champRoles.some(r => mystereRoles.includes(r));
  const allMatch = champRoles.length === mystereRoles.length && 
                  champRoles.every(r => mystereRoles.includes(r));
  return allMatch ? 'correct' : hasCommon ? 'partial' : 'incorrect';
}

// Afficher un indice
function showHint() {
  if (hintsUsed >= 3 || gameOver) return;

  const hints = [
    `Genre: ${championMystere.genre}`,
    `Région: ${championMystere.region}`,
    `Portée: ${championMystere.range}`
  ];

  const hintDiv = document.createElement('div');
  hintDiv.className = 'hint-item';
  hintDiv.textContent = hints[hintsUsed];
  hintsList.appendChild(hintDiv);

  hintsSection.classList.remove('hidden');
  hintsUsed++;
  updateHintButton();
}

// Mettre à jour le bouton d'indice
function updateHintButton() {
  hintBtnText.textContent = `Indice (${3 - hintsUsed})`;
  if (hintsUsed >= 3 || gameOver) {
    hintBtn.disabled = true;
  } else {
    hintBtn.disabled = false;
  }
}

// Afficher le message de victoire
function showWinMessage() {
  gameOver = true;
  guessInput.disabled = true;
  updateHintButton();

  // Sauvegarder les stats
  stats.played++;
  stats.won++;
  stats.streak++;
  saveStats();

  // Message de victoire
  winMessage.innerHTML = `
    <div style="font-size: 2rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #c8aa6e;">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
      </svg>
      🎉 VICTOIRE ! 🎉
    </div>
    <img src="${championMystere.icon}" alt="${championMystere.nom}" class="win-icon">
    <div style="font-size: 1.8rem; font-weight: bold; margin: 1rem 0;">
      ${championMystere.nom}
    </div>
    <div style="font-size: 1.1rem; color: #a09b8c;">
      Trouvé en ${guessedChampions.length} tentative${guessedChampions.length > 1 ? 's' : ''} !
    </div>
  `;
  winMessage.classList.remove('hidden');

  // Effet de célébration
  celebration.classList.remove('hidden');
  setTimeout(() => {
    celebration.classList.add('hidden');
  }, 1500);
}

// Charger les stats
function loadStats() {
  const saved = localStorage.getItem('loldle_stats');
  if (saved) {
    stats = JSON.parse(saved);
  }
}

// Sauvegarder les stats
function saveStats() {
  localStorage.setItem('loldle_stats', JSON.stringify(stats));
}

// Afficher les stats
function displayStats() {
  document.getElementById('statsPlayed').textContent = stats.played;
  document.getElementById('statsWon').textContent = stats.won;
  document.getElementById('statsStreak').textContent = stats.streak;
  
  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  document.getElementById('winRate').textContent = `${winRate}%`;
}

// Démarrer le jeu au chargement
window.addEventListener('load', chargerChampions);