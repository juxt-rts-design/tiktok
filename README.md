# TikTok Downloader - Téléchargeur de Vidéos TikTok Sans Filigrane

## 🎯 Description

Application web personnalisée pour télécharger des vidéos TikTok sans filigrane, développée avec React.js (frontend) et Node.js/Express (backend).

## 🏗️ Architecture

```
Tiktok/
├── src/                    # Frontend React
│   ├── App.tsx            # Composant principal
│   ├── App.css            # Styles CSS
│   └── ...
├── Backend/               # Backend Node.js
│   ├── index.js           # Serveur Express
│   └── package.json       # Dépendances backend
└── package.json           # Dépendances frontend
```

## 🔧 Technologies Utilisées

### Frontend
- **React.js** - Framework JavaScript
- **TypeScript** - Typage statique
- **Vite** - Outil de build rapide
- **Tailwind CSS** - Framework CSS
- **Axios** - Client HTTP
- **Lucide React** - Icônes

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Axios** - Client HTTP
- **CORS** - Gestion des requêtes cross-origin
- **Helmet** - Sécurité HTTP

## 🚀 Méthode de Fonctionnement

### 1. Résolution d'URLs Courtes
```javascript
// Détection et résolution des URLs courtes TikTok
if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
  const response = await axios.get(url, {
    maxRedirects: 10,
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  finalUrl = response.request.res.responseUrl || response.config.url;
}
```

### 2. API TikWM - Extraction des Métadonnées
```javascript
// Récupération des informations vidéo via TikWM
const tikwmResponse = await axios.get(`https://tikwm.com/api?url=${encodeURIComponent(finalUrl)}`, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
  },
  timeout: 30000
});
```

**Données extraites :**
- Titre de la vidéo
- Nom d'utilisateur et avatar
- URL de téléchargement (sans filigrane)
- URL de l'audio
- Miniature
- Statistiques (likes, vues, commentaires)

### 3. Proxy Local - Téléchargement Streaming
```javascript
// Route proxy pour télécharger la vidéo complète
app.get('/api/download/:videoId', async (req, res) => {
  // 1. Récupération de l'URL vidéo via TikWM
  const videoUrl = tikwmResponse.data.data.play || tikwmResponse.data.data.wmplay;
  
  // 2. Téléchargement en streaming depuis TikTok
  const videoResponse = await axios.get(videoUrl, {
    responseType: 'stream',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.tiktok.com/',
      'Accept': 'video/mp4,video/*,*/*'
    },
    timeout: 60000
  });
  
  // 3. Streaming vers le client
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="tiktok-${videoId}.mp4"`);
  videoResponse.data.pipe(res);
});
```

## 📋 Workflow Complet

1. **Utilisateur** colle une URL TikTok dans l'interface
2. **Frontend** envoie la requête au backend via Axios
3. **Backend** résout l'URL courte si nécessaire
4. **Backend** interroge l'API TikWM pour extraire les métadonnées
5. **Backend** retourne les informations à l'interface
6. **Utilisateur** clique sur "Télécharger MP4"
7. **Frontend** redirige vers la route proxy `/api/download/:videoId`
8. **Backend** télécharge la vidéo complète en streaming
9. **Utilisateur** reçoit le fichier MP4 sans filigrane

## 🛠️ Installation et Démarrage

### Prérequis
- Node.js (version 16+)
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone <repository-url>
cd Tiktok

# Installer les dépendances frontend
npm install

# Installer les dépendances backend
cd Backend
npm install
cd ..
```

### Démarrage
```bash
# Terminal 1 - Backend (port 3001)
cd Backend
npm run dev

# Terminal 2 - Frontend (port 5173)
npm run dev
```

## 🌐 Endpoints API

### `GET /api/health`
Vérification du statut de l'API
```json
{
  "status": "OK",
  "message": "TikTok Downloader API est opérationnel",
  "timestamp": "2025-09-16T12:00:00.000Z"
}
```

### `POST /api/download`
Récupération des métadonnées vidéo
```json
{
  "url": "https://www.tiktok.com/@user/video/1234567890"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "1234567890",
    "title": "Titre de la vidéo",
    "author": {
      "username": "username",
      "nickname": "Nom d'affichage",
      "avatar": "https://..."
    },
    "video": {
      "url": "https://...",
      "duration": 15,
      "size": 2048000,
      "quality": "HD"
    },
    "thumbnail": "https://...",
    "stats": {
      "likes": 1000,
      "shares": 100,
      "comments": 50,
      "views": 10000
    },
    "downloadUrl": "https://...",
    "audioUrl": "https://..."
  }
}
```

### `GET /api/download/:videoId?url=...`
Téléchargement direct de la vidéo via proxy
- **Headers de réponse :**
  - `Content-Type: video/mp4`
  - `Content-Disposition: attachment; filename="tiktok-{videoId}.mp4"`
  - `Content-Length: {taille du fichier}`

## 🔒 Sécurité

- **CORS** configuré pour les requêtes cross-origin
- **Helmet** pour les headers de sécurité HTTP
- **Validation** des URLs TikTok
- **Timeouts** pour éviter les requêtes bloquantes
- **User-Agent** réaliste pour éviter la détection

## 🎨 Interface Utilisateur

### Fonctionnalités
- **Input URL** avec validation
- **Aperçu vidéo** avec miniature
- **Informations détaillées** (auteur, statistiques)
- **Boutons de téléchargement** (MP4, MP3)
- **Design responsive** avec Tailwind CSS
- **Icônes** professionnelles (Lucide React)

### Design
- Interface moderne et épurée
- Couleurs cohérentes avec TikTok
- Animations fluides
- Feedback visuel pour les actions

## 🐛 Gestion d'Erreurs

### Types d'erreurs gérées
- URLs invalides ou non-TikTok
- Vidéos privées ou supprimées
- Erreurs de réseau
- Timeouts d'API
- Erreurs de streaming

### Messages d'erreur
```json
{
  "error": "Vidéo non trouvée",
  "message": "TikWM n'a pas pu récupérer la vidéo",
  "debug": {
    "url": "https://...",
    "videoId": "1234567890",
    "timestamp": "2025-09-16T12:00:00.000Z"
  }
}
```

## 📊 Avantages de la Méthode

### ✅ Avantages
- **Sans filigrane** - Vidéos téléchargées sans watermark TikTok
- **Qualité HD** - Récupération de la meilleure qualité disponible
- **Rapide** - Streaming direct, pas de stockage local
- **Fiable** - API TikWM stable et maintenue
- **Sécurisé** - Proxy local, pas d'exposition des URLs
- **Complet** - Métadonnées + vidéo + audio

### ⚠️ Limitations
- Dépendant de l'API TikWM
- Certaines vidéos peuvent être privées/géo-bloquées
- Rate limiting possible avec usage intensif

## 🔧 Configuration

### Variables d'environnement
```bash
# Backend
PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001
```

### Personnalisation
- Modifier les timeouts dans `Backend/index.js`
- Changer l'API dans `getTikTokVideoReal()`
- Personnaliser l'UI dans `src/App.tsx`

## 📝 Logs et Debug

### Logs Backend
```
Tentative de récupération réelle pour: https://...
Résolution de l'URL courte TikTok...
URL résolue: https://www.tiktok.com/@user/video/1234567890
Tentative avec TikWM...
Réponse TikWM: {...}
URL vidéo TikWM trouvée: https://...
```

### Debug Frontend
- Console du navigateur pour les erreurs
- Network tab pour les requêtes API
- React DevTools pour l'état des composants

## 🚀 Déploiement

### Production
```bash
# Build frontend
npm run build

# Serveur backend
cd Backend
npm start
```

### Docker (optionnel)
```dockerfile
# Dockerfile pour le backend
FROM node:18-alpine
WORKDIR /app
COPY Backend/package*.json ./
RUN npm install
COPY Backend/ .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs du backend
2. Tester avec une URL TikTok publique
3. Vérifier la connectivité réseau
4. Consulter la documentation TikWM

---

**Développé avec ❤️ pour télécharger des vidéos TikTok sans filigrane !**#   t i k t o k  
 