(function () {
	/* UTILITAIRE FETCH (avec cookies) + gestion JSON */
	async function api(path, opts = {}) {
	// URL explicite du backend en dev (front :3000, backend :3001)
		const base = 'http://localhost:3001';
		const res = await fetch(base + path, { credentials: 'include', ...opts });
		const contentType = res.headers.get('content-type') || '';
		if (!res.ok) {
			let body = null;
			try { if (contentType.includes('application/json')) body = await res.json(); else body = await res.text(); } catch (e) { body = null; }
			const err = new Error(body && body.message ? body.message : `HTTP ${res.status}`);
			err.status = res.status;
			err.body = body;
			throw err;
		}
		if (contentType.includes('application/json')) return res.json();
		return res.text();
	}

	/* LE FRONT pour requêtes Clash (gems, coffres, cartes, achat/ouverture) */
	window.clashQuery = {
		fetchUserSummary: async (userId) => {
			// Normalise userId: undefined/null/""/"undefined" -> 'me' (accepte les routes serveur /me)
			const target = (userId === undefined || userId === null || userId === '' || String(userId) === 'undefined') ? 'me' : userId;
			return api(`/clash/summary/${target}`);
		},
		fetchGems: async (userId) => {
			const target = (userId === undefined || userId === null || userId === '' || String(userId) === 'undefined') ? 'me' : userId;
			return api(`/clash/gems/${target}`);
		},
		fetchChests: async (userId) => {
			const target = (userId === undefined || userId === null || userId === '' || String(userId) === 'undefined') ? 'me' : userId;
			return api(`/clash/chests/${target}`);
		},
		fetchCards: async (userId) => {
			const target = (userId === undefined || userId === null || userId === '' || String(userId) === 'undefined') ? 'me' : userId;
			return api(`/clash/cards/${target}`);
		},
		/* ACHAT d'un coffre (route backend) */
		purchaseChest: async (userId, chestType, price, body = {}) => {
			const target = (userId === undefined || userId === null || userId === '' || String(userId) === 'undefined') ? 'me' : userId;
			return api(`/clash/purchase/${target}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(Object.assign({ chest_type: chestType, price }, body))
			});
		},
		/* OUVERTURE d'un coffre utilisateur (route backend) */
		openUserChest: async (userId, userChestId) => {
			const target = (userId === undefined || userId === null || userId === '' || String(userId) === 'undefined') ? 'me' : userId;
			return api(`/clash/open/${target}/${userChestId}`, { method: 'POST' });
		}
	};
})();

