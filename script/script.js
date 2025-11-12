// État du jeu
let champions = [];
let championMystere = null;
let guessedChampions = [];
let gameOver = false;
let revealedHints = {
  genre: false,
  spell: false,
  splash: false
};
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
const statsBtn = document.getElementById('statsBtn');
const statsModal = document.getElementById('statsModal');
const closeStatsBtn = document.getElementById('closeStatsBtn');
const newGameBtn = document.getElementById('newGameBtn');

// Charger les champions
async function chargerChampions() {
  try {
    // ✅ CORRECTION ICI : Chemin relatif vers champions.json
    const response = await fetch('script/champions.json');
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    champions = await response.json();
    console.log(`${champions.length} champions chargés avec succès !`);
    init();
  } catch (error) {
    console.error('Erreur lors du chargement des champions:', error);
    
    // Champions de secours
    champions = [
      { nom: "Ahri", genre: "Féminin", roles: ["Mage", "Assassin"], lane: "Mid", especes: "Vastaya", ressource: "Mana", range: "À distance", region: "Ionia", annee: 2011, icon: "https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Ahri.png" },
      { nom: "Yasuo", genre: "Masculin", roles: ["Combattant", "Assassin"], lane: "Mid", especes: "Humaine", ressource: "Flow", range: "Corps à corps", region: "Ionia", annee: 2013, icon: "https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Yasuo.png" },
      { nom: "Lux", genre: "Féminin", roles: ["Mage", "Support"], lane: "Mid", especes: "Humaine", ressource: "Mana", range: "À distance", region: "Demacia", annee: 2010, icon: "https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Lux.png" }
    ];
    console.log('Utilisation des champions de secours');
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
  revealedHints = {
    genre: false,
    spell: false,
    splash: false
  };
  
  guessesHistory.innerHTML = '';
  guessInput.value = '';
  guessInput.disabled = false;
  winMessage.classList.add('hidden');
  suggestions.classList.add('hidden');
  
  updateAttempts();
  createHintCards();
}

// Créer les cartes d'indices
function createHintCards() {
  hintsList.innerHTML = `
    <div class="hint-card" data-hint="genre">
      <span class="hint-card-icon">👤</span>
      <div class="hint-card-label">Genre</div>
      <div class="hint-card-value">
        <span class="hint-card-lock">🔒</span>
      </div>
    </div>
    
    <div class="hint-card hint-card-spell" data-hint="spell">
      <span class="hint-card-icon">✨</span>
      <div class="hint-card-label">Sort aléatoire</div>
      <div class="hint-card-value">
        <span class="hint-card-lock">🔒</span>
      </div>
    </div>
    
    <div class="hint-card hint-card-splash" data-hint="splash">
      <span class="hint-card-icon">🖼️</span>
      <div class="hint-card-label">Splash Art</div>
      <div class="hint-card-value">
        <span class="hint-card-lock">🔒</span>
      </div>
    </div>
  `;
  
  hintsSection.classList.remove('hidden');
  
  // Ajouter les événements de clic sur les cartes
  document.querySelectorAll('.hint-card').forEach(card => {
    card.addEventListener('click', () => {
      revealHint(card.dataset.hint, card);
    });
  });
}

// Révéler un indice
function revealHint(hintType, cardElement) {
  if (gameOver || cardElement.classList.contains('revealed')) return;
  
  const valueDiv = cardElement.querySelector('.hint-card-value');
  
  let hintValue = '';
  switch(hintType) {
    case 'genre':
      hintValue = championMystere.genre;
      break;
    case 'spell':
      if (championMystere.spells) {
        // Choisir un sort aléatoire parmi passive, q, w, e, r
        const spellKeys = ['passive', 'q', 'w', 'e', 'r'];
        const randomSpell = spellKeys[Math.floor(Math.random() * spellKeys.length)];
        const spell = championMystere.spells[randomSpell];
        
        if (spell && spell.image && spell.nom) {
          hintValue = `
            <img src="${spell.image}" alt="${spell.nom}" class="hint-spell-img">
            <div class="hint-spell-name">${spell.nom}</div>
          `;
        } else {
          hintValue = 'Non disponible';
        }
      } else {
        hintValue = 'Non disponible';
      }
      break;
    case 'splash':
      if (championMystere.splash) {
        hintValue = `<img src="${championMystere.splash}" alt="Splash Art" class="hint-splash-img">`;
      } else {
        hintValue = 'Non disponible';
      }
      break;
  }
  
  valueDiv.innerHTML = hintValue;
  cardElement.classList.add('revealed');
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

// Normaliser les lanes pour la comparaison
function normalizeLanes(lane) {
  if (Array.isArray(lane)) return lane;
  return [lane];
}

// Comparer les lanes
function compareLanes(champLanes, mystereLanes) {
  const champArray = normalizeLanes(champLanes);
  const mystereArray = normalizeLanes(mystereLanes);
  
  // Si toutes les lanes correspondent exactement
  if (champArray.length === mystereArray.length && 
      champArray.every(l => mystereArray.includes(l))) {
    return 'correct';
  }
  
  // Si au moins une lane correspond
  if (champArray.some(l => mystereArray.includes(l))) {
    return 'partial';
  }
  
  return 'incorrect';
}

// Ajouter une ligne de tentative
function addGuessRow(champion) {
  const row = document.createElement('div');
  row.className = 'guess-row';

  // Préparer l'affichage des lanes
  const champLanes = normalizeLanes(champion.lane);
  const laneDisplay = champLanes.join(' / ');

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
      html: `<div class="cell-value">${laneDisplay}</div>`, 
      class: compareLanes(champion.lane, championMystere.lane)
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
    },
    { 
      html: `<div class="cell-value">${champion.annee || 'N/A'}</div>`, 
      class: champion.annee === championMystere.annee ? 'correct' : 'incorrect'
    }
  ];

  cells.forEach((cell, index) => {
    const cellDiv = document.createElement('div');
    cellDiv.className = `guess-cell ${cell.class}`;
    cellDiv.innerHTML = cell.html;
    row.appendChild(cellDiv);
    
    // Animation en cascade avec délai
    setTimeout(() => {
      cellDiv.classList.add('animate');
    }, index * 100); // 100ms de délai entre chaque cellule
  });

  guessesHistory.insertBefore(row, guessesHistory.firstChild);
}

// Afficher le message de victoire
function showWinMessage() {
  gameOver = true;
  guessInput.disabled = true;
  
  // Désactiver toutes les cartes d'indices
  document.querySelectorAll('.hint-card').forEach(card => {
    card.classList.add('disabled');
  });

  // Sauvegarder les stats
  stats.played++;
  stats.won++;
  stats.streak++;
  saveStats();

  // Message de victoire
  const mystereLanes = normalizeLanes(championMystere.lane);
  const laneDisplay = mystereLanes.join(' / ');
  
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
      ${laneDisplay} - ${championMystere.region}
    </div>
    <div style="font-size: 1.1rem; color: #a09b8c; margin-top: 0.5rem;">
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