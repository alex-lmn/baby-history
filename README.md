# ⚽ Baby-Foot — Score & Historique

Application web conteneurisée pour gérer des matchs de baby-foot :
- **Interface "Match en direct"** : créer une partie, modifier le score en temps réel
- **Interface "Historique"** : consulter les parties précédentes (vainqueur, score, dates)

## 🧱 Stack

| Couche         | Techno                  |
|----------------|-------------------------|
| Frontend       | React 18 + Vite         |
| Backend        | Node.js + Express       |
| Base de données| PostgreSQL 15           |
| Reverse proxy  | Nginx                   |
| Conteneurs     | Docker + Docker Compose |

## 🗂️ Architecture

```
                 +-----------+
   Browser  -->  |   NGINX   |  :8080
                 +-----+-----+
                       |
        +--------------+--------------+
        |                             |
   +----+-----+                 +-----+------+
   | Frontend |                 |  Backend   |
   |  React   |                 |  Express   |
   +----------+                 +-----+------+
                                      |
                                +-----+------+
                                | PostgreSQL |
                                +------------+
```

## 🚀 Démarrage

Prérequis : **Docker Desktop** + **Git Bash** (ou PowerShell).

```bash
# 1. Cloner
git clone <URL_DU_PROJET>
cd baby-history

# 2. (optionnel) personnaliser les variables d'env
cp .env.example .env

# 3. Lancer
docker compose up -d --build
```

Accès :
- 🌐 Application : http://localhost:8080
- 🔌 API directe : http://localhost:8080/api/health

## 📡 Endpoints API

| Méthode | Route                          | Description                       |
|---------|--------------------------------|-----------------------------------|
| GET     | `/api/health`                  | Healthcheck                       |
| GET     | `/api/matches`                 | Liste de tous les matchs          |
| GET     | `/api/matches/current`         | Match `live` en cours             |
| GET     | `/api/matches/:id`             | Détail d'un match                 |
| POST    | `/api/matches`                 | Crée un match (body: team_a, team_b) |
| PATCH   | `/api/matches/:id/score`       | Met à jour le score (score_a, score_b) |
| POST    | `/api/matches/:id/finish`      | Termine le match                  |
| DELETE  | `/api/matches/:id`             | Supprime un match                 |

## 🛠️ Commandes utiles

```bash
# Suivre les logs
docker compose logs -f

# Reconstruire après modif
docker compose build --no-cache
docker compose up -d

# Stopper et tout nettoyer (⚠️ supprime le volume PostgreSQL)
docker compose down -v

# Accéder à la base
docker exec -it baby-db psql -U baby -d babyfoot
```

## 📁 Structure

```
baby-history/
├── backend/              # API Node/Express
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── Dockerfile
├── frontend/             # SPA React/Vite
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── nginx.conf        # nginx interne (serveur statique SPA)
│   └── Dockerfile        # build multi-stage
├── nginx/
│   └── nginx.conf        # reverse proxy (front + /api)
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🧩 Évolutions prévues (J3 / J4)

- Volumes nommés ✅
- Réseau dédié ✅
- Reverse proxy Nginx ✅
- Monitoring Prometheus + Grafana (à venir)
