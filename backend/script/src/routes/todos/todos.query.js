import pool from '../../config/db.js';

/* ==============================
  CREATE TODO
============================== */
export const createTodo = async ({ title, description, status = 'not started', container_id = null, due_time = null, color = null, user_id }) => {
  const sql = `
    INSERT INTO todo (title, description, status, container_id, due_time, color, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.execute(sql, [title, description, status, container_id, due_time, color, user_id]);
  return result.insertId;
};

/* ==============================
  UPDATE TODO
============================== */
export const updateTodo = async (id, updateData, user_id) => {
  // Construi dynamiquement les champs a mettre a jour
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updateData)) {
    fields.push(`${key} = ?`);
    values.push(value ?? null); // transforme undefined en null
  }

  // Ajouter id et user_id à la fin
  values.push(id, user_id);

  const sql = `
    UPDATE todo
    SET ${fields.join(", ")}
    WHERE id = ? AND user_id = ?
  `;

  const [result] = await pool.execute(sql, values);
  return result.affectedRows;
};

/* ==============================
  GET todo par son id pour un user
============================== */
export const getTodoByIdForUser = async (id, user_id) => {
  const sql = `
    SELECT * FROM todo WHERE id = ? AND user_id = ?
  `;
  const [rows] = await pool.execute(sql, [id, user_id]);
  return rows[0] || null;
};

/* ==============================
  ADD gems a un user
============================== */
export const addGemsToUser = async (user_id, amount) => {
  // Update gems and then fetch new total
  await pool.execute('UPDATE users SET gems = gems + ? WHERE id = ?', [amount, user_id]);
  const [rows] = await pool.execute('SELECT gems FROM users WHERE id = ?', [user_id]);
  return rows[0]?.gems ?? null;
};

/* ==============================
  MOVE todo a un container
============================== */
export const moveTodoToContainer = async (id, container_id, user_id) => {
  const sql = `
    UPDATE todo 
    SET container_id = ?
    WHERE id = ? AND user_id = ?
  `;
  const [result] = await pool.execute(sql, [container_id ?? null, id, user_id]);
  return result.affectedRows;
};

/* ==============================
  DELETE todo
============================== */
export const deleteTodo = async (id, user_id) => {
  const sql = 'DELETE FROM todo WHERE id = ? AND user_id = ?';
  const [result] = await pool.execute(sql, [id, user_id]);
  return result.affectedRows;
};

/* ==============================
  GET todos par le user
============================== */
export const getAllTodosByUser = async (user_id) => {
  const sql = `
    SELECT t.*, c.title AS container_title
    FROM todo t
    LEFT JOIN containers c ON t.container_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
  `;
  const [rows] = await pool.execute(sql, [user_id]);
  return rows;
};
