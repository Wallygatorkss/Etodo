import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import { fetchUserSummary, getUserGems, getUserChests, getUserCards, purchaseChest, openUserChest } from './clash.query.js';

const router = express.Router();


// Route de test non protegee pour verifier que le router est bien monte
router.get('/ping', (req, res) => {
	res.status(200).json({ ok: true, msg: 'clash router mounted' });
});

// permet d'agir sur les gems, coffres, cartes d'un utilisateur authentifie

// 2 variantes pour chaque route : /me et /:userId 
// le 1er utilise le token pour identifier l'utilisateur
// le 2eme utilise le userId passe en parametre et verifie qu'il correspond a l'utilisateur du token

// recup les infos du user courant (verifie par le token)
router.get('/summary/me', verifyToken, async (req, res) => {
	try {
		const summary = await fetchUserSummary(req.user.id);
		res.status(200).json(summary);
	} catch (err) {
		console.error('Erreur fetchUserSummary (me):', err);
		res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
	}
});

// permet d'avoir le nb de gems du user
router.get('/gems/me', verifyToken, async (req, res) => {
	try {
		const gems = await getUserGems(req.user.id);
		res.status(200).json({ gems });
	} catch (err) {
		console.error('Erreur getUserGems (me):', err);
		res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
	}
});

// permet d'avoir une liste des coffres du user
router.get('/chests/me', verifyToken, async (req, res) => {
	try {
		const chests = await getUserChests(req.user.id);
		res.status(200).json(chests);
	} catch (err) {
		console.error('Erreur getUserChests (me):', err);
		res.status(500).json({ message: 'Erreur serveur' });
	}
});

// permet d'avoir une liste des cartes du user
router.get('/cards/me', verifyToken, async (req, res) => {
	try {
		const cards = await getUserCards(req.user.id);
		res.status(200).json(cards);
	} catch (err) {
		console.error('Erreur getUserCards (me):', err);
		res.status(500).json({ message: 'Erreur serveur' });
	}
});

/**
 * GET /api/clash/chests/:userId
 */
// liste les coffres du user specifie par userId et verrifie que son id correspond a celui du token
router.get('/chests/:userId', verifyToken, async (req, res) => {
	const userId = parseInt(req.params.userId, 10);
	if (isNaN(userId)) return res.status(400).json({ message: 'userId invalide' });
	if (req.user && req.user.id !== userId) return res.status(403).json({ message: 'Accès non autorisé' });

	try {
		const chests = await getUserChests(userId);
		res.status(200).json(chests);
	} catch (err) {
		console.error('Erreur getUserChests:', err);
		res.status(500).json({ message: 'Erreur serveur' });
	}
});

/**
 * GET /api/clash/cards/:userId
 */
// liste les cartes du user specifie par userId et verrifie que son id correspond a celui du token
router.get('/cards/:userId', verifyToken, async (req, res) => {
	const userId = parseInt(req.params.userId, 10);
	if (isNaN(userId)) return res.status(400).json({ message: 'userId invalide' });
	if (req.user && req.user.id !== userId) return res.status(403).json({ message: 'Accès non autorisé' });

	try {
		const cards = await getUserCards(userId);
		res.status(200).json(cards);
	} catch (err) {
		console.error('Erreur getUserCards:', err);
		res.status(500).json({ message: 'Erreur serveur' });
	}
});

/**
 * GET /api/clash/summary/:userId
 * Renvoie un résumé de l'utilisateur (gems, coffres, cartes)
 */
// renvoie le resume du user (gems/chests/cards) et verfie que "
router.get('/summary/:userId', verifyToken, async (req, res) => {
	console.log('route /api/clash/summary/:userId called with params ->', req.params);
	const userId = parseInt(req.params.userId, 10);
	if (isNaN(userId)) return res.status(400).json({ message: 'userId invalide' });

	if (req.user && req.user.id !== userId) {
		return res.status(403).json({ message: 'Accès non autorisé' });
	}

	try {
		const summary = await fetchUserSummary(userId);
		res.status(200).json(summary);
	} catch (err) {
		console.error('Erreur fetchUserSummary:', err);
		const status = err.status || 500;
		res.status(status).json({ message: err.message || 'Erreur serveur' });
	}
});

/**
 * GET /api/clash/gems/:userId
 */
// permet d'avoir le nb de gems du user specifie par userId et "
router.get('/gems/:userId', verifyToken, async (req, res) => {
	const userId = parseInt(req.params.userId, 10);
	if (isNaN(userId)) return res.status(400).json({ message: 'userId invalide' });
	if (req.user && req.user.id !== userId) return res.status(403).json({ message: 'Accès non autorisé' });

	try {
		const gems = await getUserGems(userId);
		res.status(200).json({ gems });
	} catch (err) {
		console.error('Erreur getUserGems:', err);
		res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
	}
});

/**
 * POST /api/clash/purchase/:userId
 * Body: { chest_type, price, ...metadata }
 */
// au moment d'acheter un coffre, valide le chest_type et le price et met a jour les gems du user
router.post('/purchase/:userId', verifyToken, async (req, res) => {
	try {
		const raw = req.params.userId;
		const userId = raw === 'me' ? req.user.id : parseInt(raw, 10);
		if (isNaN(userId)) return res.status(400).json({ message: 'userId invalide' });
		if (req.user && req.user.id !== userId) return res.status(403).json({ message: 'Accès non autorisé' });

		const { chest_type: chestType, price } = req.body || {};
		if (!chestType || typeof price !== 'number') return res.status(400).json({ message: 'chest_type et price requis' });

		const result = await purchaseChest(userId, chestType, price, req.body);
		res.status(200).json({ id: result.id, gems: result.gems });
	} catch (err) {
		console.error('Erreur purchaseChest:', err);
		res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
	}
});

/**
 * POST /api/clash/open/:userId/:userChestId
 */
// ouvre un coffre specifie par userChestId pour le userId donne et renvoie la recompense
router.post('/open/:userId/:userChestId', verifyToken, async (req, res) => {
	try {
		const raw = req.params.userId;
		const userId = raw === 'me' ? req.user.id : parseInt(raw, 10);
		const userChestId = parseInt(req.params.userChestId, 10);
		if (isNaN(userId) || isNaN(userChestId)) return res.status(400).json({ message: 'userId ou userChestId invalide' });
		if (req.user && req.user.id !== userId) return res.status(403).json({ message: 'Accès non autorisé' });

		const reward = await openUserChest(userId, userChestId);
		res.status(200).json(reward);
	} catch (err) {
		console.error('Erreur openUserChest:', err);
		res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
	}
});

export default router;