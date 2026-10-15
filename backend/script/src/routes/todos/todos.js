import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import { 
  getAllTodosByUser,
  createTodo,
  updateTodo,
  moveTodoToContainer,
  deleteTodo,
  getTodoByIdForUser,
  addGemsToUser,
} from './todos.query.js';

const router = express.Router();

/* ===========================
  Récupérer toutes les todos de l'utilisateur connecté
  GET /todos
=========================== */
router.get('/', verifyToken, async (req, res) => {
  try {
    const todos = await getAllTodosByUser(req.user.id);
    const MIN_R = parseInt(process.env.MIN_GEMS_PER_DONE || '1', 10);
    const MAX_R = parseInt(process.env.MAX_GEMS_PER_DONE || '50', 10);
    const min = Number.isFinite(MIN_R) ? MIN_R : 1;
    const max = Number.isFinite(MAX_R) ? MAX_R : 50;
    const saneMin = Math.max(1, Math.min(min, max));
    const saneMax = Math.max(saneMin, max);
    // enrichir chaque todo avec rewardGemsMin/Max (visible si pas done et pas déjà récompensée)
    const enriched = todos.map(t => ({
      ...t,
      rewardGemsMin: (t.status !== 'done' && !t.gems_awarded) ? saneMin : 0,
      rewardGemsMax: (t.status !== 'done' && !t.gems_awarded) ? saneMax : 0,
    }));
    res.status(200).json(enriched);
  } catch (error) {
    console.error('Erreur MySQL:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des todos." });
  }
});

/* ===========================
  Créer une nouvelle todo
  POST /todos
=========================== */
router.post('/', verifyToken, async (req, res) => {
  const { title, description, status, container_id, due_time, color } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'title et description sont requis.' });
  }

  try {
    const newTodoId = await createTodo({ 
      title, 
      description, 
      status, 
      container_id, 
      due_time, 
      color,
      user_id: req.user.id 
    });
    res.status(201).json({ message: '✅ Todo créée avec succès', todoId: newTodoId });
  } catch (error) {
    console.error('Erreur MySQL:', error);
    res.status(500).json({ message: "Erreur lors de la création de la todo." });
  }
});

/* ===========================
  Mettre à jour une todo
  PUT /todos/:id
=========================== */
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, container_id, due_time, color } = req.body;

  // Construit un objet à mettre à jour uniquement avec les champs fournis
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (container_id !== undefined) updateData.container_id = container_id;
  if (color !== undefined) updateData.color = color;
  if (due_time !== undefined) updateData.due_time = due_time;

  try {
    // Lire l'état actuel pour détecter le passage en 'done' et savoir si récompense déjà donnée
    let previous = null;
    try {
      previous = await getTodoByIdForUser(id, req.user.id);
    } catch {}

    // Déterminer si on doit attribuer les gemmes (premier passage à done et jamais récompensé)
    const willSetDone = updateData.status === 'done';
    const canAward = previous && willSetDone && previous.status !== 'done' && previous.gems_awarded === 0;
    if (canAward) {
      // On marque la todo comme récompensée dans la même mise à jour
      updateData.gems_awarded = 1; // BOOLEAN stocké comme tinyint(1) en MySQL
    }

    const affectedRows = await updateTodo(id, updateData, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Todo non trouvée ou non autorisée." });
    }

    // Calcul récompense gemmes si transition vers 'done'
  const MIN_R = parseInt(process.env.MIN_GEMS_PER_DONE || '1', 10);
  const MAX_R = parseInt(process.env.MAX_GEMS_PER_DONE || '50', 10);
  const min = Number.isFinite(MIN_R) ? MIN_R : 1;
  const max = Number.isFinite(MAX_R) ? MAX_R : 50;
  const saneMin = Math.max(1, Math.min(min, max));
  const saneMax = Math.max(saneMin, max);
  const randomReward = () => Math.floor(Math.random() * (saneMax - saneMin + 1)) + saneMin;
    let awardGems = 0;
    let newGems = null;
    if (canAward) {
      awardGems = randomReward();
      try {
        newGems = await addGemsToUser(req.user.id, awardGems);
      } catch (e) {
        console.error('Erreur ajout gemmes:', e);
      }
    }

  res.status(200).json({ message: "✅ Todo mise à jour avec succès", awardGems, gems: newGems, gems_awarded: canAward });
  } catch (error) {
    console.error('Erreur MySQL:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la todo." });
  }
});


/* ===========================
  Déplacer une todo dans un container
  PATCH /todos/:id/move
=========================== */
router.patch('/:id/move', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { container_id } = req.body;

  if (container_id === undefined) {
    return res.status(400).json({ message: 'container_id est requis.' });
  }
console.log('PATCH /todos/:id/move');
  console.log('Params id:', id);
  console.log('Body container_id:', container_id);
  console.log('User ID from token:', req.user.id);
  try {
    const affectedRows = await moveTodoToContainer(id, container_id, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Todo non trouvée ou non autorisée." });
    }
    res.status(200).json({ message: "✅ Todo déplacée avec succès" });
  } catch (error) {
    console.error('Erreur MySQL:', error);
    res.status(500).json({ message: "Erreur lors du déplacement de la todo." });
    console.log('Update data:', { id, title, description, status, container_id, done, due_time, user_id: req.user.id });
  }
});

/* ===========================
  Supprimer une todo
  DELETE /todos/:id
=========================== */
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const affectedRows = await deleteTodo(id, req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Todo non trouvée ou non autorisée." });
    }
    res.status(200).json({ message: "✅ Todo supprimée avec succès" });
  } catch (error) {
    console.error('Erreur MySQL:', error);
    res.status(500).json({ message: "Erreur lors de la suppression de la todo." });
  }
});

export default router;

// GET /todos/:id  fetch une seule todo par son id pour le user
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const todo = await getTodoByIdForUser(id, req.user.id);
    if (!todo) return res.status(404).json({ message: 'Todo non trouvée ou non autorisée.' });
    return res.status(200).json(todo);
  } catch (error) {
    console.error('Erreur MySQL:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération de la todo.' });
  }
});
