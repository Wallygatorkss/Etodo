import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import express from 'express';
import { findUser } from '../users/users.query.js'; 
import dotenv from 'dotenv';
dotenv.config();


console.log("il rentre dans auth.js")

/* LA CONNEXION */
const auth = express.Router();
auth.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("il rentre dans connexion")
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  try {
    const user = await findUser(email);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    /*POUR CACHER LE MDP*/
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.cookie("token", token, {
    httpOnly: false,
    secure: false, // mettre true en HTTPS
    sameSite: "lax",
    path: "/",
  });



    res.json({ message: 'Connexion réussie', token });

  } catch (error) {
    console.error('Erreur MySQL:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

export default auth;