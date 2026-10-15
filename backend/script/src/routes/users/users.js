import express from 'express';
import { insertUser, getUserById, getUserWithPasswordById, updateEmail, updateUserProfile, updatePassword, deleteUser, findUser } from './users.query.js'; 
import { getAllTodosByUser } from '../todos/todos.query.js';
import dotenv from 'dotenv';
import { verifyToken } from '../../middleware/auth.js';
dotenv.config();


const router = express.Router();

/* POST/register  cree un nouveau user apres validation de ts les champs */
router.post('/register', async(req, res) => {
  const { firstname, name, email, password } = req.body;

  console.log('Données reçues:', req.body);

  if (!firstname || !name || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    const newUserId = await insertUser(firstname, name, email, password);
    res.status(201).json({
      message: '✅ Utilisateur ajouté avec succès',
      userId: newUserId,  
    });
  } catch (error) {
    console.error('Erreur MySQL:', error);
    res.status(500).json({ message: "Erreur lors de l'insertion dans la base de données." });
  }
});



/* GET/user   renvoie le profil du user (via req.user.id)*/
router.get('/user', verifyToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

/* PUT/users/:id  update le mail,prenom,nom du user si l'id du user
  qu'on essaye d'update correspond a l'id du user connecte*/
router.put('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ message: 'Action non autorisée' });
  }
  const { email, firstname, name } = req.body;
  if (!email && !firstname && !name) {
    return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
  }
  try {
    const affected = await updateUserProfile(req.user.id, { email, firstname, name });
    if (!affected) return res.status(404).json({ message: 'Utilisateur introuvable ou données identiques.' });
    return res.status(200).json({ message: 'Profil mis à jour' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
});

/* change le password du user (verifie l'ancien puis enregistre le nouveau*/
router.put('/password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Les deux mots de passe sont requis' });
  try {
    const user = await getUserWithPasswordById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
  const bcryptModule = await import('bcryptjs');
  const bcrypt = bcryptModule.default ?? bcryptModule;
  const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    const affected = await updatePassword(req.user.id, newPassword);
    if (!affected) return res.status(500).json({ message: 'Impossible de mettre à jour le mot de passe' });
    return res.status(200).json({ message: 'Mot de passe mis à jour' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la modification du mot de passe' });
  }
});

/* DELETE/users/:id   supp le compte si l'id du compte correspond a l'id
  du user connecte*/
router.delete('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ message: 'Action non autorisée' });
  }
  try {
    const affected = await deleteUser(req.user.id);
    if (!affected) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    return res.status(200).json({ message: 'Compte supprimé' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
});

/* update la pp*/
router.put('/profile-image', verifyToken, async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ message: 'Image requise' });
  try {
    const { updateProfileImage } = await import('./users.query.js');
    const affected = await updateProfileImage(req.user.id, image);
    if (!affected) return res.status(404).json({ message: 'Utilisateur introuvable ou image identique' });
    return res.status(200).json({ message: 'Photo de profil mise à jour' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la photo' });
  }
});

/* update la background-image du board */
router.put('/board-background', verifyToken, async (req, res) => {
  const { image } = req.body;
  try {
    const { updateBoardBackground } = await import('./users.query.js');
    const affected = await updateBoardBackground(req.user.id, image || null);
    if (!affected) return res.status(404).json({ message: 'Utilisateur introuvable' });
    return res.status(200).json({ message: 'Image de fond mise à jour' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'image de fond' });
  }
});

/* GET/user/todos   renvoie ttes les todos du user*/
router.get('/user/todos', verifyToken, async (req, res) => {
  try {
    const todos = await getAllTodosByUser(req.user.id);
    return res.status(200).json(todos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des todos.' });
  }
});

/* GET/users/:id ou /users/:email   recup un user par son id ou son mail
  et cache le password si c'est par mail */
router.get('/users/:idOrEmail', verifyToken, async (req, res) => {
  const value = req.params.idOrEmail;
  try {
    if (/^\d+$/.test(value)) {
      const user = await getUserById(Number(value));
      if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
      return res.json(user);
    } else if (value.includes('@')) {
      const user = await findUser(value);
      if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
      const { password, ...safe } = user;
      return res.json(safe);
    } else {
      return res.status(400).json({ message: 'Paramètre invalide' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
