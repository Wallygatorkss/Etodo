# eTodo

> Une application de gestion de tâches moderne, organisée autour d'un tableau visuel et pensée pour rendre la productivité plus motivante.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## Aperçu du projet

**eTodo** est une application web de gestion de tâches développée dans le cadre d'un projet EPITECH. Elle permet de créer, organiser et suivre ses tâches depuis une interface de type tableau, avec une boîte de réception et des colonnes personnalisables.

L'application repose sur une architecture séparée :

- un frontend Next.js / React pour l'interface ;
- un backend Node.js / Express pour l'API REST ;
- une base de données MySQL initialisée automatiquement ;
- une authentification par cookie contenant un jeton JWT.

## Fonctionnalités clés

- **Gestion complète des tâches** : création, modification, suppression, statut, description, couleur et date d'échéance ;
- **Organisation visuelle** : boîte de réception, colonnes personnalisées et déplacement des tâches par glisser-déposer ;
- **Comptes utilisateurs** : inscription, connexion, modification du profil, changement du mot de passe et suppression du compte ;
- **Personnalisation** : photo de profil et arrière-plan du tableau ;
- **Gamification** : récompenses en gemmes et fonctionnalités inspirées des jeux de cartes et de coffres ;
- **Interface responsive** avec thème clair/sombre et composants accessibles basés sur Radix UI.

## Technologies utilisées

| Couche | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI |
| Backend | Node.js 20, Express 5, JWT, bcryptjs |
| Base de données | MySQL 8 |
| Déploiement local | Docker, Docker Compose |

## Prérequis

Pour lancer la version conteneurisée, installez :

- [Docker](https://docs.docker.com/get-docker/) ;
- [Docker Compose](https://docs.docker.com/compose/), inclus dans les versions récentes de Docker Desktop et du plugin Docker.

Pour un lancement sans Docker, il faut également Node.js 20 ou supérieur, npm et un serveur MySQL 8.

## Installation et lancement avec Docker

### 1. Cloner le projet

```bash
git clone https://github.com/EpitechBachelorPromo2028/B-WEB-101-MPL-1-1-etodo-5.git
cd B-WEB-101-MPL-1-1-etodo-5
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```dotenv
PORT=3001
MYSQL_HOST=db
MYSQL_USER=root
MYSQL_PASSWORD=example
MYSQL_DATABASE=etodo
JWT_SECRET=changez-cette-cle-secrete
JWT_EXPIRES_IN=24h
MIN_GEMS_PER_DONE=1
MAX_GEMS_PER_DONE=50
```

> En production, remplacez impérativement les valeurs d'exemple, en particulier `JWT_SECRET` et le mot de passe MySQL.

### 3. Construire et démarrer les services

```bash
docker compose up --build
```

Au premier démarrage, le script [`e-todo.sql`](./e-todo.sql) initialise automatiquement la base de données MySQL.

L'application est ensuite accessible aux adresses suivantes :

- **Frontend** : [http://localhost:3000](http://localhost:3000)
- **API backend** : [http://localhost:3001](http://localhost:3001)
- **MySQL depuis la machine hôte** : `localhost:3307`

Pour arrêter les conteneurs :

```bash
docker compose down
```

Pour supprimer également les données MySQL persistées :

```bash
docker compose down -v
```

### 4. Utiliser l'application

1. Ouvrez [http://localhost:3000](http://localhost:3000).
2. Créez un compte ou utilisez un compte existant.
3. Ajoutez une tâche depuis la boîte de réception.
4. Créez des colonnes et déplacez les tâches par glisser-déposer.
5. Modifiez votre profil et vos préférences depuis la page des paramètres.

La base de données de démonstration contient également un compte préchargé par le script SQL. Pour un usage réel, il est recommandé de créer un nouveau compte et de modifier les identifiants de démonstration avant tout déploiement.

## Lancement en développement sans Docker

### Backend

Depuis le dossier du backend :

```bash
cd backend
npm install
npm start
```

Le backend écoute sur le port `3001`. Dans ce mode, adaptez `MYSQL_HOST` à votre installation MySQL, par exemple `localhost`, et vérifiez que la base `etodo` a été créée à partir du fichier [`e-todo.sql`](./e-todo.sql).

### Frontend

Dans un second terminal :

```bash
cd frontend/todo
npm install
npm run dev
```

Le frontend de développement est disponible sur [http://localhost:3000](http://localhost:3000).

Pour produire puis servir un build de production :

```bash
npm run build
npm start
```

## Structure du projet

```text
.
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── script/src/
│       ├── config/          # Connexion MySQL
│       ├── middleware/      # Authentification et gestion des erreurs
│       ├── routes/          # Routes users, auth, todos, containers et clash
│       └── index.js         # Point d'entrée de l'API Express
├── frontend/
│   ├── Dockerfile
│   └── todo/
│       ├── app/              # Pages et layout Next.js
│       ├── components/       # Interface et composants réutilisables
│       ├── hooks/            # Accès aux données et logique frontend
│       └── public/           # Ressources statiques
├── e-todo.sql                # Schéma et données initiales MySQL
├── docker-compose.yml         # Orchestration frontend, backend et base
└── start.sh                   # Script de démarrage fourni par le projet
```

## Ce que j'ai appris / Défis techniques

- **Concevoir une architecture frontend/backend** : séparer l'interface Next.js de l'API Express a permis de clarifier les responsabilités et de rendre chaque partie plus facilement maintenable.
- **Gérer l'authentification** : la création d'un parcours de connexion avec JWT, cookies et middleware de vérification m'a permis de mieux comprendre la protection des routes et la gestion d'une session côté client.
- **Modéliser les relations MySQL** : les relations entre utilisateurs, tâches et colonnes nécessitent des clés étrangères, des suppressions en cascade et une gestion cohérente des tâches déplacées vers la boîte de réception.
- **Implémenter une interaction de type Kanban** : le glisser-déposer demande de synchroniser l'état de l'interface avec l'API tout en conservant une expérience fluide pour l'utilisateur.
- **Conteneuriser une application complète** : Docker Compose coordonne trois services dépendants, attend la disponibilité de MySQL et initialise la base de données au premier lancement.
- **Structurer une interface réutilisable** : l'utilisation de TypeScript, de hooks personnalisés et de composants UI réutilisables limite les duplications et facilite l'évolution de l'application.

## Licence

Ce projet est proposé sous licence **MIT**. Voir le fichier [`LICENSE`](./LICENSE) pour le texte complet de la licence.

