// État du jeu
let champions = [];
let currentChampion = null;
let attempts = 0;
let maxHints = 3;
let hintCount = 0;
let gameOver = false;
let stats = {
  played: 0,
  won: 0,
  streak: 0
};

// Éléments DOM
const splashImage = document.getElementById('splashImage');
const blurOverlay = document.getElementById('blurOverlay');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const hintButton = document.getElementById('hintButton');
const hintsUsed = document.getElementById('hintsUsed');
const attemptsDisplay = document.getElementById('attemptsDisplay');
const resultMessage = document.getElementById('resultMessage');
const celebration = document.getElementById('celebration');
const statsBtn = document.getElementById('statsBtn');
const statsModal = document.getElementById('statsModal');
const closeStatsBtn = document.getElementById('closeStatsBtn');
const newGameBtn = document.getElementById('newGameBtn');

// Charger les champions
async function loadChampions() {
  try {
    const response = await fetch('script/champions.json');
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    champions = await response.json();
    console.log(`${champions.length} champions chargés pour Splash Art !`);
    loadStats();
    newGame();
    setupEventListeners();
  } catch (error) {
    console.error('Erreur lors du chargement des champions:', error);
    // Champions de secours avec splash
    champions = [
      { 
        nom: "Ahri", 
        region: "Ionia", 
        roles: ["Mage"], 
        annee: 2011,
        splash: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
        icon: "https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Ahri.png"
      },
      { 
        nom: "Yasuo", 
        region: "Ionia", 
        roles: ["Combattant"], 
        annee: 2013,
        splash: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg",
        icon: "https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/Yasuo.png"
      }
    ];
    loadStats();
    newGame();
    setupEventListeners();
  }
}

// Nouvelle partie
function newGame() {
  currentChampion = champions[Math.floor(Math.random() * champions.length)];
  console.log("Champion mystère (Splash):", currentChampion.nom);
  
  attempts = 0;
  hintCount = 0;
  gameOver = false;
  
  // Charger le splash art
  splashImage.src = currentChampion.splash;
  splashImage.style.filter = 'blur(30px) brightness(0.6)';
  
  // Reset UI
  searchInput.value = '';
  searchInput.disabled = false;
  searchSuggestions.classList.add('hidden');
  resultMessage.classList.add('hidden');
  hintButton.disabled = false;
  
  updateUI();
}

// Mettre à jour l'interface
function updateUI() {
  attemptsDisplay.textContent = `Tentatives: ${attempts}`;
  hintsUsed.textContent = hintCount;
  
  if (hintCount >= maxHints) {
    hintButton.disabled = true;
    hintButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 8px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      Plus d'indices disponibles
    `;
  }
}

// Réduire le flou (indice)
function giveHint() {
  if (hintCount >= maxHints || gameOver) return;
  
  attempts++;
  hintCount++;
  
  // Réduire progressivement le flou
  const blurAmount = 30 - (hintCount * 10);
  const brightness = 0.6 + (hintCount * 0.15);
  splashImage.style.filter = `blur(${blurAmount}px) brightness(${brightness})`;
  
  updateUI();
}

// Vérifier la proposition
function checkGuess(championName) {
  if (gameOver) return;
  
  attempts++;
  updateUI();
  
  if (championName.toLowerCase() === currentChampion.nom.toLowerCase()) {
    win();
  } else {
    // Feedback visuel d'échec
    searchInput.classList.add('incorrect-shake');
    setTimeout(() => {
      searchInput.classList.remove('incorrect-shake');
    }, 500);
  }
  
  searchInput.value = '';
  searchSuggestions.classList.add('hidden');
}

// Victoire
function win() {
  gameOver = true;
  searchInput.disabled = true;
  hintButton.disabled = true;
  
  // Révéler complètement l'image
  splashImage.style.filter = 'blur(0px) brightness(1)';
  
  // Sauvegarder les stats
  stats.played++;
  stats.won++;
  stats.streak++;
  saveStats();
  
  // Message de victoire
  resultMessage.innerHTML = `
    <div style="font-size: 2rem; margin-bottom: 1rem;">
      🎉 BRAVO ! 🎉
    </div>
    <img src="${currentChampion.icon}" alt="${currentChampion.nom}" style="width: 100px; height: 100px; border-radius: 50%; margin: 1rem 0; border: 3px solid #c8aa6e;">
    <div style="font-size: 1.8rem; font-weight: bold; margin: 1rem 0;">
      ${currentChampion.nom}
    </div>
    <div style="font-size: 1.1rem; color: #a09b8c;">
      ${currentChampion.region} - ${currentChampion.roles.join(', ')}
    </div>
    <div style="font-size: 1.1rem; color: #a09b8c; margin-top: 0.5rem;">
      Trouvé en ${attempts} tentative${attempts > 1 ? 's' : ''} avec ${hintCount} indice${hintCount > 1 ? 's' : ''} !
    </div>
  `;
  resultMessage.classList.remove('hidden');
  
  // Effet de célébration
  celebration.classList.remove('hidden');
  setTimeout(() => {
    celebration.classList.add('hidden');
  }, 1500);
}

// Configuration des événements
function setupEventListeners() {
  // Recherche de champion
  searchInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase().trim();
    
    if (value.length === 0 || gameOver) {
      searchSuggestions.classList.add('hidden');
      return;
    }
    
    const filtered = champions.filter(c => 
      c.nom.toLowerCase().includes(value)
    ).slice(0, 5); // Limiter à 5 résultats
    
    if (filtered.length > 0) {
      searchSuggestions.innerHTML = filtered.map(c => `
        <div class="suggestion-item" data-champion="${c.nom}">
          <img src="${c.icon}" alt="${c.nom}" class="suggestion-icon">
          <span>${c.nom}</span>
        </div>
      `).join('');
      searchSuggestions.classList.remove('hidden');
      
      document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          checkGuess(item.dataset.champion);
        });
      });
    } else {
      searchSuggestions.classList.add('hidden');
    }
  });
  
  // Entrée avec clavier
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstSuggestion = document.querySelector('.suggestion-item');
      if (firstSuggestion) {
        checkGuess(firstSuggestion.dataset.champion);
      }
    }
  });
  
  // Clic à l'extérieur pour fermer suggestions
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchSuggestions.classList.add('hidden');
    }
  });
  
  // Bouton indice
  hintButton.addEventListener('click', giveHint);
  
  // Nouveau jeu
  newGameBtn.addEventListener('click', newGame);
  
  // Stats modal
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
  const saved = localStorage.getItem('loldle_splash_stats');
  if (saved) {
    stats = JSON.parse(saved);
  }
}

function saveStats() {
  localStorage.setItem('loldle_splash_stats', JSON.stringify(stats));
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