import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';


/* POUR AJOUTER UN USER */
export const insertUser = async (firstname, name, email, password) => {
  const sql = 'INSERT INTO users (firstname, name, email, password) VALUES (?, ?, ?, ?)';
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.execute(sql, [firstname, name, email, hashedPassword]);
};

/* POUR TROUVER UN USER AVEC LE MAIL */
export const findUser = async (email , password)  => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(sql,[email]);
    return rows[0];
}

/* TROUVER UN USER PAR ID */
export const getUserById = async (id) => {
  const sql = 'SELECT id, firstname, name, email, profile_image, board_background FROM users WHERE id = ?';
  const [rows] = await pool.execute(sql, [id]);
  return rows[0];
};

/* TROUVER UN USER PAR ID (INCLUANT MOT DE PASSE) - usage interne pour verifications */
export const getUserWithPasswordById = async (id) => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  const [rows] = await pool.execute(sql, [id]);
  return rows[0];
};

/* METTRE A JOUR LA PHOTO DE PROFIL (STOCKAGE BASE64) */
export const updateProfileImage = async (id, imageDataUrl) => {
  const sql = 'UPDATE users SET profile_image = ? WHERE id = ?';
  const [result] = await pool.execute(sql, [imageDataUrl, id]);
  return result.affectedRows;
};

/* METTRE A JOUR L'IMAGE DE FOND DU BOARD */
export const updateBoardBackground = async (id, imageDataUrl) => {
  const sql = 'UPDATE users SET board_background = ? WHERE id = ?';
  const [result] = await pool.execute(sql, [imageDataUrl, id]);
  return result.affectedRows;
};

/* METTRE A JOUR L'EMAIL D'UN USER */
export const updateEmail = async (id, email) => {
  const sql = 'UPDATE users SET email = ? WHERE id = ?';
  const [result] = await pool.execute(sql, [email, id]);
  return result.affectedRows;
};

/* METTRE A JOUR PLUSIEURS CHAMPS (email, firstname, name) */
export const updateUserProfile = async (id, { email, firstname, name }) => {
  const setClauses = [];
  const values = [];
  if (email) { setClauses.push('email = ?'); values.push(email); }
  if (firstname) { setClauses.push('firstname = ?'); values.push(firstname); }
  if (name) { setClauses.push('name = ?'); values.push(name); }
  if (!setClauses.length) return 0; // rien a mettre a jour
  const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
  values.push(id);
  const [result] = await pool.execute(sql, values);
  return result.affectedRows;
};

/* METTRE A JOUR LE MOT DE PASSE D'UN USER */
export const updatePassword = async (id, newPassword) => {
  const hashed = await bcrypt.hash(newPassword, 10);
  const sql = 'UPDATE users SET password = ? WHERE id = ?';
  const [result] = await pool.execute(sql, [hashed, id]);
  return result.affectedRows;
};

/* SUPPRIMER UN USER */
export const deleteUser = async (id) => {
  const sql = 'DELETE FROM users WHERE id = ?';
  const [result] = await pool.execute(sql, [id]);
  return result.affectedRows;
};