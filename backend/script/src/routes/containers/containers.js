import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getAllContainers,
  getContainerById,
  createContainer,
  updateContainer,
  deleteContainer,
  reorderContainers,
} from "./containers.query.js";
import pool from "../../config/db.js";

const router = express.Router();

// Toutes les routes protégées
router.use(verifyToken);

// GET les conatainers du user
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    const containers = await getAllContainers(userId);
    res.json(containers);
  } catch (e) {
    console.error("GET /api/containers:", e);
    res.status(500).json({ message: "Erreur récupération containers" });
  }
});

// cree un nouveau container
router.post("/", async (req, res) => {
  try {
    const { title, color } = req.body;
    const userId = req.user?.id || req.user?.user_id;
    if (!title) return res.status(400).json({ message: "title requis" });
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    // forward color (may be undefined/null)
    const created = await createContainer(title, userId, color);
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /api/containers:", e);
    res.status(500).json({ message: "Erreur création container" });
  }
});

// met a jour un container
router.put("/:id", async (req, res) => {
  try {
    const { title, color } = req.body;
    const userId = req.user?.id || req.user?.user_id;
    if (!title) return res.status(400).json({ message: "title requis" });
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    const existing = await getContainerById(req.params.id);
    if (!existing || existing.user_id !== userId) return res.status(404).json({ message: "Container introuvable" });
    const updated = await updateContainer(req.params.id, title, color ?? null, userId);
    res.json(updated);
  } catch (e) {
    console.error("PUT /api/containers/:id:", e);
    res.status(500).json({ message: "Erreur update container" });
  }
});

// reorganise les containers par odre d'id
router.patch("/reorder", async (req, res) => {
  try {
    console.log('PATCH /api/containers/reorder hit - body:', req.body, 'headers:', {authorization: req.headers['authorization'], cookie: req.headers['cookie']});
    const { order } = req.body; // on attend un array d'id de containers dans l'ordre voulu
    const userId = req.user?.id || req.user?.user_id;
    if (!Array.isArray(order)) return res.status(400).json({ message: "order array requis" });
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    await reorderContainers(order, userId);
    // inform client success
    res.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/containers/reorder error:", e);
    res.status(500).json({ message: "Erreur reorder containers" });
  }
});

// supprime un container et detach les tasks liees
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });

    const id = Number(req.params.id);
    const existing = await getContainerById(id);
    if (!existing || existing.user_id !== userId) {
      return res.status(404).json({ message: "Container introuvable" });
    }

    // Detache les tasks du container (table todo)
    await pool.query(
      "UPDATE todo SET container_id = NULL WHERE container_id = ? AND user_id = ?",
      [id, userId]
    );

    await deleteContainer(id, userId);
    return res.status(204).end();
  } catch (e) {
    console.error("DELETE /api/containers/:id error:", e);
    return res.status(500).json({ message: "Erreur suppression container", detail: e.message });
  }
});

export default router;