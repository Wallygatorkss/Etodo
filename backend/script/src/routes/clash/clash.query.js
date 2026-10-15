
import db from '../../config/db.js';

/**
 * Récupère un résumé simple de l'utilisateur : gems, coffres et cartes.
 * Les requêtes SQL restent centralisées ici.
 * @param {number} userId
 * @returns {Promise<{gems:number, chests: Array, cards: Array}>}
 */
export async function fetchUserSummary(userId) {
	// Récupère les gems depuis la table users
	const [[userRow]] = await db.query('SELECT gems FROM users WHERE id = ?', [userId]);
	if (!userRow) {
		const err = new Error('Utilisateur non trouvé');
		err.status = 404;
		throw err;
	}

	const gems = Number(userRow.gems) || 0;

		// Récupère les coffres de l'utilisateur (id et chest_code)
		let chestsRows = [];
		try {
			const [rows] = await db.query('SELECT id, chest_code FROM user_chests WHERE user_id = ?', [userId]);
			chestsRows = rows;
		} catch (err) {
			// Si la table n'existe pas ou autre erreur, on log et on continue avec tableau vide
			console.warn('fetchUserSummary: cannot read user_chests:', err.message);
			chestsRows = [];
		}

		// Récupère les cartes de l'utilisateur (si la table existe)
		let cardsRows = [];
		try {
			const [rows] = await db.query('SELECT user_id, card_code, quantity FROM user_cards WHERE user_id = ?', [userId]);
			cardsRows = rows;
		} catch (err) {
			console.warn('fetchUserSummary: cannot read user_cards:', err.message);
			cardsRows = [];
		}

		return {
			gems,
			chests: Array.isArray(chestsRows) ? chestsRows : [],
			cards: Array.isArray(cardsRows) ? cardsRows : []
		};
}

/**
 * Récupère uniquement le nombre de gems d'un utilisateur
 * @param {number} userId
 */
export async function getUserGems(userId) {
	const [[row]] = await db.query('SELECT gems FROM users WHERE id = ?', [userId]);
	if (!row) {
		const err = new Error('Utilisateur non trouvé');
		err.status = 404;
		throw err;
	}
	return Number(row.gems) || 0;
}

/**
 * Récupère les coffres (user_chests) d'un utilisateur
 * @param {number} userId
 */
export async function getUserChests(userId) {
	try {
		const [rows] = await db.query('SELECT id, chest_code, status, metadata, acquired_at, opened_at FROM user_chests WHERE user_id = ?', [userId]);
		return Array.isArray(rows) ? rows : [];
	} catch (err) {
		console.warn('getUserChests: cannot read user_chests:', err.message);
		return [];
	}
}

/**
 * Récupère les cartes (user_cards) d'un utilisateur
 * @param {number} userId
 */
export async function getUserCards(userId) {
	try {
		const [rows] = await db.query('SELECT user_id, card_code, quantity FROM user_cards WHERE user_id = ?', [userId]);
		return Array.isArray(rows) ? rows : [];
	} catch (err) {
		console.warn('getUserCards: cannot read user_cards:', err.message);
		return [];
	}
}

/**
 * au moment d'acheter un coffre, valide le chest_type et le price et met a jour
 * le nb de gems du user dans la table users et ajoute une entree dans user_chests
 */
export async function purchaseChest(userId, chestCode, price, metadata = {}) {
	const conn = await db.getConnection();
	try {
		await conn.beginTransaction();
		const [[userRow]] = await conn.query('SELECT gems FROM users WHERE id = ? FOR UPDATE', [userId]);
		if (!userRow) {
			const err = new Error('Utilisateur non trouvé');
			err.status = 404;
			throw err;
		}
		const current = Number(userRow.gems) || 0;
		if (current < price) {
			const err = new Error('Pas assez de gemmes');
			err.status = 400;
			throw err;
		}
		const newGems = current - price;
		await conn.query('UPDATE users SET gems = ? WHERE id = ?', [newGems, userId]);

		const [insertResult] = await conn.query('INSERT INTO user_chests (user_id, chest_code, status, metadata, acquired_at) VALUES (?, ?, ?, ?, NOW())', [userId, chestCode, 'available', JSON.stringify(metadata || {})]);
		await conn.commit();
		return { id: insertResult.insertId, gems: newGems };
	} catch (err) {
		try { await conn.rollback(); } catch (e) { /* ignore */ }
		throw err;
	} finally {
		conn.release();
	}
}

/**
 * ouvre un coffre specifie par userChestId pour le userId donne
 * et renvoie la recompense (cartes)
 */
export async function openUserChest(userId, userChestId) {
	const conn = await db.getConnection();
	try {
		await conn.beginTransaction();
		const [[chestRow]] = await conn.query('SELECT id, user_id, chest_code, status FROM user_chests WHERE id = ? FOR UPDATE', [userChestId]);
		if (!chestRow) {
			const err = new Error('Coffre introuvable');
			err.status = 404;
			throw err;
		}
		if (Number(chestRow.user_id) !== Number(userId)) {
			const err = new Error('Accès non autorisé sur ce coffre');
			err.status = 403;
			throw err;
		}
		if (chestRow.status === 'opened') {
			const err = new Error('Coffre déjà ouvert');
			err.status = 400;
			throw err;
		}

		// implemente une logique de recompense selon le chest_code
		const chestCode = chestRow.chest_code || 'wood';

		// cree une pool de cartes par rarete
		const pools = {
			commun: ['Arrows','eBarbs','Bats','Horde','Knight','Mortar','RG','RoyalRecruits','Bomber','Tesla'],
			rare: ['BattleHealer','DartGob','Giant','Hog','MP','Musk','Wiz'],
			epic: ['DarkPrince','eDragon','Golem','Guards','Witch','XBow'],
			legendaire: ['MagicArcher','MegaKnight_base','molosse-de-lave','princesse','zappy'],
			champion: ['ArcherQueen','BossBandit']
		};

		// configuration des coffres et de leur drop rate en fonction du
		// chest_code
		const chestConfig = {
			wood: { total: 2, probs: { commun: 60, rare: 25, epic: 10, legendaire: 3, champion: 2 } },
			gold: { total: 3, probs: { commun: 40, rare: 40, epic: 10, legendaire: 8, champion: 2 } },
			giant: { total: 5, probs: { commun: 45, rare: 40, epic: 5, legendaire: 8, champion: 2 } },
			magic: { total: 5, probs: { commun: 30, rare: 30, epic: 25, legendaire: 10, champion: 5 } },
			legendaire: { total: 1, probs: { commun: 20, rare: 25, epic: 25, legendaire: 25, champion: 5 } },
			foudre: { total: 8, probs: { commun: 10, rare: 20, epic: 30, legendaire: 30, champion: 10 } },
			legendaire_du_boss: { total: 10, probs: { commun: 10, rare: 15, epic: 30, legendaire: 30, champion: 15 } }
		};

		const cfg = chestConfig[chestCode] || chestConfig.wood;

		// determine la rarete de chaque carte a dropper selon les probabilites
		function chooseRarity(probs) {
			const rand = Math.random() * 100;
			let cum = 0;
			for (const r of ['commun','rare','epic','legendaire','champion']) {
				cum += (probs[r] || 0);
				if (rand <= cum) return r;
			}
			return 'commun';
		}

		// genere les recompenses (cartes) du coffre
		const rewards = [];
		for (let i = 0; i < cfg.total; i++) {
			const rarity = chooseRarity(cfg.probs);
			const pool = pools[rarity] || pools.commun;
			const card = pool[Math.floor(Math.random() * pool.length)];
			rewards.push(card);
		}

		// cree un objet pour compter les quantites de chaque carte
		const card_count = {};
		for (const c of rewards) card_count[c] = (card_count[c] || 0) + 1;

		// ajouute ou update les cartes dans user_cards
		for (const [cardCode, qty] of Object.entries(card_count)) {
			try {
				await conn.query(
					`INSERT INTO user_cards (user_id, card_code, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
					[userId, cardCode, qty]
				);
			} catch (e) {
				// si la table n'existe pas ou autre, on log et on continue
				console.warn('openUserChest: cannot upsert user_cards:', e.message);
			}
		}

		// retire le coffre de l'inventaire
		await conn.query('DELETE FROM user_chests WHERE id = ?', [userChestId]);

		await conn.commit();
		return { cards: rewards };
	} catch (err) {
		try { await conn.rollback(); } catch (e) { /* ignore */ }
		throw err;
	} finally {
		conn.release();
	}
}
