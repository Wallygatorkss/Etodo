const chests = document.querySelectorAll('.chest');

/* TRIER LES CARTES PAR RARETE */
const cards = {
  commun: [
    "Arrows",
    "eBarbs",
    "Bats",
    "Horde",
    "Knight",
    "Mortar",
    "RG",
    "RoyalRecruits",
    "Bomber",
    "Tesla"
  ],

  rare: [
    "BattleHealer",
    "DartGob",
    "Giant",
    "Hog",
    "MP",
    "Musk",
    "Wiz"
  ],

  epic: [
    "DarkPrince",
    "eDragon",
    "Golem",
    "Guards",
    "Witch",
    "XBow"
  ],

  legendaire: [
    "MagicArcher",
    "MegaKnight_base",
    "molosse-de-lave",
    "princesse",
    "zappy"
  ],

  champion: [
    "ArcherQueen",
    "BossBandit",
  ],

  evo: []
};

const rarityOrder = ["commun", "rare", "epic", "legendaire", "champion"];

/* DEFINIR LES COFFRES ET LEURS PROBA */
const chestTypes = {
  wood: {
    totalCards: 2,        // nombre de cartes du coffre
    guaranteed: {commun: 1},       // garanties
    probabilities: {  // probas en pourcentage
      commun: 60,
      rare: 25,
      epic: 10,
      legendaire: 3,
      champion: 2
    }
  },

  gold: {
    totalCards: 3,
    guaranteed: { rare: 1 }, 
    probabilities: {
      commun: 40,
      rare: 40,
      epic: 10,
      legendaire: 8,
      champion: 2
    }
  },
  
  giant: {
    totalCards: 5,
    guaranteed: { rare: 2 },
    probabilities: {
      commun: 45,
      rare: 40,
      epic: 5,
      legendaire: 8,
      champion: 2
    }
  },

  magic: {
    totalCards: 5,
    guaranteed: { epic: 1 },
    probabilities: {
      commun: 30,
      rare: 30,
      epic: 25,
      legendaire: 10,
      champion: 5
    }
  },

  legendaire: {
    totalCards: 1,
    guaranteed: { legendaire: 1 },
    probabilities: {
      commun: 20,
      rare: 25,
      epic: 25,
      legendaire: 25,
      champion: 5
    }
  },

  foudre: {
    totalCards: 8,
    guaranteed: { legendaire: 1 },
    probabilities: {
      commun: 10,
      rare: 20,
      epic: 30,
      legendaire: 30,
      champion: 10
    }
  },

  legendaire_du_boss: {
    totalCards: 10,
    guaranteed: { champion: 1 },
    probabilities: {
      commun: 10,
      rare: 15,
      epic: 30,
      legendaire: 30,
      champion: 15
    }
  }
};
/* GÈRENT LES PROBABILITÉS POUR RARETE*/
function chooseRarity(probabilities) {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of rarityOrder) {
  cumulative += probabilities[rarity];
  if (rand <= cumulative) return rarity;
  }
}

/* TIRER UNE CARTE ALÉATOIRE SELON LA RARETÉ */
function getRandomCard(rarity) {
  const arr = cards[rarity];
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ANIMATION D'OUVERTURE DE COFFRE */
function showDropAnimation(drops) {
  const container = document.createElement('div');
  container.classList.add('drop-container');
  document.body.appendChild(container);
  drops.forEach(cardName => {
    const img = document.createElement('img');
    img.src = `images_cartes/${getCardFolder(cardName)}/${cardName}.png`; // adapte le chemin
    img.classList.add('drop-card');
    const angle = Math.random() * 2 * Math.PI; // 0 à 360°
    const radius = 250 + Math.random() * 100; // distance minimum 150px
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const finalX = window.innerWidth / 2; // ici centre horizontal
    const finalY = window.innerHeight - 400;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    img.style.setProperty('--x', x);
    img.style.setProperty('--y', y);
    img.style.setProperty('--finalX', finalX - centerX);
    img.style.setProperty('--finalY', finalY - centerY);
    container.appendChild(img);
    // Suppr l'image après l'animation
    img.addEventListener('animationend', () => {
      img.remove();
    });
  });
  // Supprime le conteneur après toutes les animations
  setTimeout(() => {
    container.remove();
  }, 2000);
}

/* DÉVERROUILLER VISUELLEMENT UNE CARTE */
function unlockCard(cardName) {
  const card = document.querySelector(`.card[data-card="${cardName}"]`);
  if (card) {
    card.classList.remove("locked");
  }
}


const cardCounts = {};
function getCardElement(cardCode) {
  return document.querySelector(`.card[data-card="${cardCode}"]`);
}
/* MET À JOUR LE NOMBRE DE CARTES POSSÉDÉES */
function setCardCount(cardCode, count) {
  cardCounts[cardCode] = Number(count) || 0;
  const card = getCardElement(cardCode);
  if (!card) return;
  // met à jour la barre de progression
  const progressText = card.querySelector('.progress-text');
  const progressBar = card.querySelector('.progress-bar');
  const max = 20; 
  const value = Math.max(0, Number(cardCounts[cardCode]) || 0);
  const pct = Math.min(100, Math.round((value / max) * 100));
  if (progressText) progressText.textContent = `${value}/${max}`;
  if (progressBar) progressBar.style.width = `${pct}%`;
  // déverrouille visuellement si premiere carte
  if (value > 0) card.classList.remove('locked');
}

function incrementCardCount(cardCode, delta = 1) {
  const newCount = (cardCounts[cardCode] || 0) + delta;
  setCardCount(cardCode, newCount);
}

/* GÈRE L'OUVERTURE DES COFFRES AU CLIC */
// d'abord le backend
chests.forEach(chest => {
  const type = chest.dataset.type;
  const userChestId = chest.dataset.userChestId; // possible pour coffres créés côté serveur
  attachOpenChestHandler(chest, { type, userChestId });
});

/* GÈRE L'ACHAT DE COFFRES DANS LA BOUTIQUE */
let gems = null; 
const gemDisplay = document.querySelector('.gemmes'); // affichage gems
const W_CURRENT_USER_ID = (typeof window !== 'undefined' && window.CURRENT_USER_ID !== undefined && window.CURRENT_USER_ID !== null && window.CURRENT_USER_ID !== '' && String(window.CURRENT_USER_ID) !== 'undefined') ? window.CURRENT_USER_ID : undefined;
const asideContainer = document.querySelector('.chest-container');

/*OUVERTURE COFFRE*/
function attachOpenChestHandler(btn, { type, userChestId }) {
  btn.addEventListener('click', async () => {
    try {
      if (userChestId && window.clashQuery && typeof window.clashQuery.openUserChest === 'function') {
        const userId = W_CURRENT_USER_ID;
        const reward = await window.clashQuery.openUserChest(userId, userChestId);
        if (reward && Array.isArray(reward.cards)) {
          showDropAnimation(reward.cards);
          reward.cards.forEach(card => {
            unlockCard(card);
            try { incrementCardCount(card, 1); } catch (e) { console.warn('incrementCardCount failed', e); }
          });
        }
        // Rafraîchit les gemmes depuis le serveur
        try {
          if (window.clashQuery && typeof window.clashQuery.fetchUserSummary === 'function') {
            const refreshed = await window.clashQuery.fetchUserSummary(userId);
            if (refreshed && typeof refreshed.gems === 'number') {
              gems = refreshed.gems;
              updateGems();
            }
          }
        } catch (e2) {
          console.warn('Refresh des gemmes après ouverture erreur : ', e2);
        }
      } 
    } catch (e) {
      console.error('Erreur ouverture coffre', e);
      alert(e.message || 'Erreur ouverture');
    }
    // Supprime le bouton une fois le coffre consommé
    btn.remove();
  });
}

/* AJOUTE UN COFFRE À L'INVENTAIRE VISUELLEMENT */
function addChestToInventory({ chestType, userChestId, imgSrc }) {
  const newChestBtn = document.createElement('button');
  newChestBtn.classList.add('chest');
  newChestBtn.dataset.type = chestType;
  if (userChestId) newChestBtn.dataset.userChestId = userChestId;
  const img = document.createElement('img');
  img.src = imgSrc || getChestImageSrc(chestType);
  img.classList.add('chest_img');
  newChestBtn.appendChild(img);
  newChestBtn.appendChild(document.createTextNode('OUVRIR'));
  asideContainer.appendChild(newChestBtn);
  attachOpenChestHandler(newChestBtn, { type: chestType, userChestId });
  return newChestBtn;
}

/* INITIALISER LES DONNÉES DEPUIS LE SERVEUR (GEMMES/COFFRES/CARTES) */
async function initFromServer() {
    try {
  const userId = W_CURRENT_USER_ID;
    if (window.clashQuery && window.clashQuery.fetchUserSummary) {
      const summary = await window.clashQuery.fetchUserSummary(userId);
      if (summary && typeof summary.gems === 'number') {
        gems = summary.gems;
        //RENDRE LES GEMMES DEPUIS LE SERVEUR
        updateGems();
      }

      // RENDRE LES COFFRES DE L'UTILISATEUR DEPUIS LE SERVEUR
      if (Array.isArray(summary.chests)) {
        summary.chests.forEach(c => {
          const chestType = c.chest_code || c.chestCode || 'wood';
          addChestToInventory({ chestType, userChestId: c.id });
        });
      }

      // RENDRE LES CARTES DE L'UTILISATEUR DEPUIS LE SERVEUR
      if (Array.isArray(summary.cards)) {
        summary.cards.forEach(cardRow => {
          // cardRow: { user_id, card_code, quantity }
          setCardCount(cardRow.card_code, cardRow.quantity);
        });
      }
    }
  } catch (e) {
    console.warn('Init from server failed:', e);
  }
}
// lance l'init au chargement
initFromServer();

// Met à jour l'affichage des gems (utilisé au dessus)
function updateGems() {
  if (!gemDisplay) return;
  if (gems === null) {
    gemDisplay.innerHTML = `— <img class="gemme-image" src="image_fond/gems-icon-r-removebg-preview.png"><p id="plus">+</p>`;
    return;
  }
  gemDisplay.innerHTML = `${gems} <img class="gemme-image" src="image_fond/gems-icon-r-removebg-preview.png"><p id="plus">+</p>`;
}

/* AFFICHER LES CARTES EN 3D */
function attachCard3DHandlers() {
  const allCards = document.querySelectorAll('.card');
  allCards.forEach(card => {
    // éviter d'ajouter des eventlistener en double
    if (card._has3DListener) return;
    card._has3DListener = true;

    card.addEventListener('click', (e) => {
      // Ignorer si verrouillé
      if (card.classList.contains('locked')) return;
      const code = card.dataset.card;
      if (!code) return;
      // Plus basculer l'affichage 3D et l'inverse
      const imgEl = card.querySelector('.carte') || card.querySelector('img');
      if (!imgEl) return;
      if (card.dataset.showing3d === 'true') {
        const original = card.dataset.originalSrc;
        if (original) imgEl.src = original;
        delete card.dataset.showing3d;
        card.classList.remove('lowered');
        return;
      }
      // stocker la source originale pour pouvoir revenir en arrière
      if (!card.dataset.originalSrc) card.dataset.originalSrc = imgEl.src;
      card.classList.add('lowered');

      // Essaye les différentes extensions pour les images 3D
      const exts = ['png', 'webp', 'jpg', 'jpeg'];
      let idx = 0;
      const tryNext = () => {
        if (idx >= exts.length) {
          // si pas trouvé, remettre à l'état normal
          setTimeout(() => card.classList.remove('lowered'), 250);
          return;
        }
        const candidate = `3d/${code}.${exts[idx++]}`;
        const tester = new Image();
        tester.onload = () => {
          imgEl.src = candidate;
          card.dataset.showing3d = 'true';
        };
        tester.onerror = tryNext;
        tester.src = candidate;
      };
      tryNext();
    });
  });
}

attachCard3DHandlers();

// reattacher quand de nouvelles cartes sont ajoutées dynamiquement
const cardsContainer = document.querySelector('.card-container');
if (cardsContainer) {
  const mo = new MutationObserver(() => attachCard3DHandlers());
  mo.observe(cardsContainer, { childList: true, subtree: true });
}

/* GÈRE L'ACHAT DE COFFRES DANS LA BOUTIQUE */
const buyButtons = document.querySelectorAll('.acheter');
buyButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const price = parseInt(btn.textContent);
    const coffreDiv = btn.closest('.coffre');
    const chestType = coffreDiv.dataset.type; 
    const imgSrc = coffreDiv.querySelector('img').src; 

  const userId = W_CURRENT_USER_ID;

    if (gems < price) return alert('Pas assez de gemmes !');

    // APPELE DU BACKEND POUR ACHETER LE COFFRE
    try {
      if (window.clashQuery && window.clashQuery.purchaseChest) {
        const resp = await window.clashQuery.purchaseChest(userId, chestType, price, { chest_code: chestType });
        try {
          const refreshed = await window.clashQuery.fetchUserSummary(userId);
          if (refreshed && typeof refreshed.gems === 'number') {
            gems = refreshed.gems;
            updateGems();
          } else {
            
            gems -= price;
            updateGems();
          }
        } catch (e4) {
          console.warn('Fetch summary after purchase failed, using local update', e4);
          gems -= price;
          updateGems();
        }

  addChestToInventory({ chestType, userChestId: resp.id, imgSrc });
      } else {
        
        gems -= price;
        updateGems();
  addChestToInventory({ chestType, userChestId: undefined, imgSrc });
      }
    } catch (err) {
      console.error('Erreur achat:', err);
      alert(err.message || 'Erreur lors de l\'achat');
    }
  });
});

function getCardFolder(cardName) {
    for (const rarity in cards) {
        if (cards[rarity].includes(cardName)) return rarity;
    }
    return 'commun'; // fallback
}

// Retourne le chemin de l'image pour un type de coffre donné
function getChestImageSrc(type) {
  switch ((type || '').toString()) {
    case 'wood': return 'coffre/wood.png';
    case 'gold': return 'coffre/gold.webp';
    case 'giant': return 'coffre/giant.webp';
    case 'magic': return 'coffre/magical.webp';
    case 'legendaire': return 'coffre/legendary.png';
    case 'foudre': return 'coffre/mlc.png';
    case 'legendaire_du_boss': return 'coffre/legendarykings.png';
    default: return 'coffre/wood.png';
  }
}
