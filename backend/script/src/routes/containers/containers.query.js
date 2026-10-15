import pool from '../../config/db.js';
const db = pool;

// retourne la liste des containers d'un user
export async function getAllContainers(userId) {
  const [rows] = await db.query(
    "SELECT id, title, color, position FROM containers WHERE user_id = ? ORDER BY COALESCE(position, id) ASC",
    [userId]
  );
  return rows;
}

// retourne un container par son id
export async function getContainerById(id) {
  const [rows] = await db.query("SELECT id, title, color, user_id FROM containers WHERE id = ?", [id]);
  return rows[0] || null;
}

// cree un nouveau container
export async function createContainer(title, userId, color = null) {
  // determine la prochaine position du cnontainer
  const [[{ maxpos }]] = await db.query(
    "SELECT COALESCE(MAX(position), 0) as maxpos FROM containers WHERE user_id = ?",
    [userId]
  );
  const nextPos = (maxpos || 0) + 1;
  const [result] = await db.query(
    "INSERT INTO containers (title, color, user_id, position) VALUES (?, ?, ?, ?)",
    [title, color, userId, nextPos]
  );
  return { id: result.insertId, title, color, user_id: userId, position: nextPos };
}

// update un container
export async function updateContainer(id, title, color, userId) {
  // n'autorise que le proprietaire
  await db.query("UPDATE containers SET title = ?, color = ? WHERE id = ? AND user_id = ?", [title, color, id, userId]);
  return getContainerById(id);
}

// supprime un container et detach les tasks liees
export async function deleteContainer(id, userId) {
  // securise suppression de ses propres containers
  await db.query("DELETE FROM containers WHERE id = ? AND user_id = ?", [id, userId]);
  return true;
}

// reorganise les containers par odre d'id
export async function reorderContainers(orderIds, userId) {
  // orderIds: array des containers ids dans l'ordre voulu
  const conn = db;
  try {
    await conn.beginTransaction?.();
  } catch (e) {
    // ignore si pas le bon type de connexion
  }
  try {
    for (let i = 0; i < orderIds.length; i++) {
      const id = orderIds[i];
      await db.query("UPDATE containers SET position = ? WHERE id = ? AND user_id = ?", [i + 1, id, userId]);
    }
    try {
      await conn.commit?.();
    } catch (e) {}
    return true;
  } catch (e) {
    try {
      await conn.rollback?.();
    } catch (er) {}
    throw e;
  }
}