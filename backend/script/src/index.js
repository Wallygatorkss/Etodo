// backend/src/index.js
import express from 'express';
import dotenv from 'dotenv';
import todoRoutes from './routes/todos/todos.js';
import router from './routes/users/users.js';
import auth from './routes/auth/auth.js';
import cors from "cors";
import cookieParser from "cookie-parser";
import { verifyToken } from './middleware/auth.js';
import notFound from './middleware/notfound.js';
import containerRoutes from './routes/containers/containers.js';
import clashRoutes from './routes/clash/clash.js';
import errorHandler from './middleware/errorHandler.js';



/* CHARGE LE ENV */
dotenv.config();

/* LANCE  EXPRESS */
const app = express();
const PORT = process.env.PORT || 3001; // techniquement on a pas besoin du 3001 pck il est defini dans le docker compose

// app.use permet de monter des fonctions du middleware
// a une instance d'application express

// configure le cross origin ressource sharing (CORS) pour permettre
// au front (port:3000) d'accéder au backend
app.use(cors({
  origin: "http://localhost:3000", // le front
  credentials: true, // pour les cookies
}));

// pour parser (separer) les infos des cookies
app.use(cookieParser());
/* POUR PERMETTRE DE LIRE LE JSON */
app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// monte les routes /containers avec verification du token
app.use('/containers', verifyToken, containerRoutes);


// Le front Next.js ecoute sur :3000 et sert lui meme /login.html.
// Si quelqu'un atteint la racine du backend, on redirige vers le front (page du login)
app.get('/', (req, res) => {
  return res.redirect('http://localhost:3000/login.html');
});

// monte les routes /todos, /register, /user, /login, etc
app.use('/todos', todoRoutes);
app.use('/', auth); // expose les routes de connextion /login et /logout
app.use('/', router); // expose les routes /register, /user, /users/:id, etc
// Les routes containers sont deja protegees ci dessus
app.use('/clash', clashRoutes);

// pour gerer les erreurs 404
app.use(notFound);
app.use(errorHandler); //gestion des messages centralise

/* LANCE LE SERVEUR */
app.listen(PORT, () => {
  console.log(`✅ Serveur en marche sur http://localhost:${PORT}`);
});