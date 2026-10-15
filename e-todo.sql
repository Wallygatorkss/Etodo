DROP DATABASE IF EXISTS etodo;
CREATE DATABASE etodo;
USE etodo;


CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  profile_image MEDIUMTEXT DEFAULT NULL, -- base64 (jusqu'à ~16MB) 
  board_background MEDIUMTEXT DEFAULT NULL, -- image de fond du board (base64)
  gems INT NOT NULL DEFAULT 1000, -- compteur de gemmes lié à l'utilisateur
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE containers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT NULL,
    position INT DEFAULT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_container
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE todo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(250) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    due_time DATETIME NOT NULL DEFAULT '2026-01-10 12:00:00',
    status ENUM('not started', 'todo', 'in progress', 'done') DEFAULT 'not started',
    done BOOLEAN DEFAULT FALSE,
    gems_awarded BOOLEAN NOT NULL DEFAULT FALSE,
  color VARCHAR(7) DEFAULT NULL,
    container_id INT NULL,
    user_id INT NOT NULL,
    CONSTRAINT fk_container
        FOREIGN KEY (container_id) REFERENCES containers(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_user_todo
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE user_chests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  chest_code VARCHAR(100) NOT NULL,      -- ex 'wood'
  status VARCHAR(20) NOT NULL DEFAULT 'locked',
  metadata JSON DEFAULT NULL,
  acquired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP NULL
);

CREATE TABLE user_cards (
  user_id INT NOT NULL,
  card_code VARCHAR(250) NOT NULL,       -- ex 'Arrows'
  quantity INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, card_code)
);


INSERT INTO users (email, password, name, firstname)
VALUES ('paul.demarque@epitech.eu', 'caca', 'Demarque', 'Paul');

INSERT INTO containers (title, color, user_id) VALUES 
('Maison', NULL, 1),
('Travail', NULL, 1);

INSERT INTO todo (title, description, status, container_id, user_id, color) VALUES 
('Faire la vaisselle', 'Nettoyer la cuisine', 'todo', 1, 1, NULL),
('Envoyer mails', 'Répondre aux mails importants', 'in progress', 2, 1, NULL),
('Créer README', 'Rédiger la doc du projet', 'not started', NULL, 1, NULL); 
