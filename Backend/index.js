const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { PassThrough } = require('stream');

// 🚀 CACHES POUR ACCÉLÉRATION ULTRA-RAPIDE
const urlCache = new Map(); // Cache des URLs courtes résolues
const metadataCache = new Map(); // Cache des métadonnées TikWM
const videoCache = new Map(); // Cache des URLs vidéo téléchargées

// Configuration optimisée pour la vitesse
const httpsAgent = new https.Agent({ 
  keepAlive: true, 
  maxSockets: 50,
  timeout: 10000
});

// Dossier de cache temporaire pour les vidéos
const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Nettoyage du cache toutes les heures
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 heure
  
  for (const [key, value] of urlCache.entries()) {
    if (now - value.timestamp > maxAge) {
      urlCache.delete(key);
    }
  }
  
  for (const [key, value] of metadataCache.entries()) {
    if (now - value.timestamp > maxAge) {
      metadataCache.delete(key);
    }
  }
  
  // Nettoyer les fichiers vidéo anciens
  fs.readdir(CACHE_DIR, (err, files) => {
    if (!err) {
      files.forEach(file => {
        const filePath = path.join(CACHE_DIR, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });
}, 60 * 60 * 1000);

// Fonction pour utiliser TikWM API (priorité)
async function getTikTokVideoTikWM(url) {
  console.log('Tentative avec TikWM API pour:', url);
  
  try {
    const response = await axios.get(`https://tikwm.com/api?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    console.log('TikWM - Status:', response.status);
    console.log('TikWM - Data:', response.data);
    
    if (response.data && response.data.code === 0 && response.data.data) {
      const data = response.data.data;
      return {
        success: true,
        data: {
          id: data.id || Date.now().toString(),
          title: data.title || 'Vidéo TikTok',
          author: {
            username: data.author?.unique_id || 'tiktok_user',
            nickname: data.author?.nickname || 'Utilisateur TikTok',
            avatar: data.author?.avatar || null
          },
          video: {
            url: data.play || data.wmplay,
            duration: data.duration || 0,
            size: data.size || 0,
            quality: 'HD'
          },
          thumbnail: data.cover || data.origin_cover || null,
          stats: {
            likes: data.digg_count || 0,
            shares: data.share_count || 0,
            comments: data.comment_count || 0,
            views: data.play_count || 0
          },
          downloadUrl: data.play || data.wmplay,
          audioUrl: data.music || null
        }
      };
    }
    
    throw new Error('TikWM ne retourne pas de données valides');
    
  } catch (error) {
    console.error('TikWM - Erreur:', error.message);
    throw error;
  }
}

// Fonction pour utiliser BOTCAHX API locale (fallback)
async function getTikTokVideoBOTCAHX(url) {
  console.log('Tentative avec BOTCAHX API locale pour:', url);
  
  try {
    const response = await axios.get(`http://localhost:3000/tiktok/api.php?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    console.log('BOTCAHX - Status:', response.status);
    console.log('BOTCAHX - Data:', response.data);
    
    if (response.data && (response.data.video || response.data.audio)) {
      return {
        success: true,
        data: {
          id: Date.now().toString(),
          title: 'Vidéo TikTok',
          author: {
            username: 'tiktok_user',
            nickname: 'Utilisateur TikTok',
            avatar: null
          },
          video: {
            url: response.data.video?.[0] || response.data.video,
            duration: 0,
            size: 0,
            quality: 'HD'
          },
          thumbnail: null,
          stats: {
            likes: 0,
            shares: 0,
            comments: 0,
            views: 0
          },
          downloadUrl: response.data.video?.[0] || response.data.video
        }
      };
    }
    
    throw new Error('BOTCAHX ne retourne pas de données valides');
    
  } catch (error) {
    console.error('BOTCAHX - Erreur:', error.message);
    throw error;
  }
}

// 🚀 FONCTION ULTRA-RAPIDE AVEC CACHE DES MÉTADONNÉES
async function getTikTokVideoReal(url) {
  console.log('🚀 Tentative de récupération ultra-rapide pour:', url);
  
  // Vérifier le cache des métadonnées d'abord
  if (metadataCache.has(url)) {
    const cached = metadataCache.get(url);
    console.log(`🚀 Métadonnées trouvées dans le cache pour: ${url}`);
    return cached;
  }
  
  // Résoudre l'URL courte si nécessaire (avec cache)
  let finalUrl = url;
  if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
    finalUrl = await resolveTikTokUrl(url);
  }

  // Utilisation de l'API TikWM avec configuration optimisée
  try {
    console.log('🔍 Tentative avec TikWM (optimisé)...');
    const tikwmResponse = await axios.get(`https://tikwm.com/api?url=${encodeURIComponent(finalUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 12000, // Réduit de 30s à 12s
      httpsAgent: httpsAgent // Keep-alive pour la vitesse
    });

    console.log('📊 Réponse TikWM reçue');
    
    if (tikwmResponse.data && tikwmResponse.data.code === 0 && tikwmResponse.data.data) {
      const data = tikwmResponse.data.data;
      const result = {
        success: true,
        data: {
          id: data.id || Date.now().toString(),
          title: data.title || 'Vidéo TikTok',
          author: {
            username: data.author?.unique_id || 'tiktok_user',
            nickname: data.author?.nickname || 'Utilisateur TikTok',
            avatar: data.author?.avatar || null
          },
          video: {
            url: data.play || data.wmplay,
            duration: data.duration || 0,
            size: data.size || 0,
            quality: 'HD'
          },
          thumbnail: data.cover || data.origin_cover || null,
          stats: {
            likes: data.digg_count || 0,
            shares: data.share_count || 0,
            comments: data.comment_count || 0,
            views: data.play_count || 0
          },
          downloadUrl: data.play || data.wmplay,
          audioUrl: data.music || null
        }
      };
      
      // Mettre en cache les métadonnées
      metadataCache.set(url, result);
      metadataCache.set(finalUrl, result); // Cache aussi pour l'URL résolue
      
      console.log('✅ Métadonnées récupérées et mises en cache');
      return result;
    } else {
      throw new Error(`TikWM a retourné une erreur: ${JSON.stringify(tikwmResponse.data)}`);
    }
  } catch (tikwmError) {
    console.error('❌ Erreur TikWM:', tikwmError.message);
    throw new Error(`Impossible de récupérer la vidéo: ${tikwmError.message}`);
  }
}


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de sécurité
app.use(helmet());

// Configuration CORS pour permettre les requêtes depuis le frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TikTok Downloader API est opérationnel',
    timestamp: new Date().toISOString()
  });
});

// Route de test avec une vidéo publique
app.get('/api/test-video', async (req, res) => {
  try {
    // Utiliser une vidéo TikTok publique connue pour tester
    const testUrl = 'https://www.tiktok.com/@tiktok/video/7000000000000000000';
    console.log('Test avec vidéo publique:', testUrl);
    
    const result = await getTikTokVideoReal(testUrl);
    res.json({
      success: true,
      message: 'Test réussi',
      data: result
    });
  } catch (error) {
    console.error('Erreur de test:', error.message);
    res.status(500).json({
      success: false,
      message: 'Test échoué',
      error: error.message
    });
  }
});

// 🚀 Route de statistiques de cache pour monitoring
app.get('/api/cache-stats', (req, res) => {
  try {
    const stats = {
      urlCache: {
        size: urlCache.size,
        entries: Array.from(urlCache.keys())
      },
      metadataCache: {
        size: metadataCache.size,
        entries: Array.from(metadataCache.keys())
      },
      videoCache: {
        files: fs.existsSync(CACHE_DIR) ? fs.readdirSync(CACHE_DIR).length : 0,
        totalSize: 0
      },
      performance: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };

    // Calculer la taille totale du cache vidéo
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      stats.videoCache.totalSize = files.reduce((total, file) => {
        const filePath = path.join(CACHE_DIR, file);
        const stats = fs.statSync(filePath);
        return total + stats.size;
      }, 0);
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erreur de récupération des stats' });
  }
});

// 🚀 Route pour vider le cache
app.post('/api/clear-cache', (req, res) => {
  try {
    // Vider les caches en mémoire
    urlCache.clear();
    metadataCache.clear();
    videoCache.clear();

    // Supprimer les fichiers de cache vidéo
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      });
    }

    res.json({
      success: true,
      message: 'Cache vidé avec succès',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du vidage du cache' });
  }
});

// Route principale pour télécharger les vidéos TikTok
app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validation de l'URL
    if (!url) {
      return res.status(400).json({ 
        error: 'URL TikTok requise',
        message: 'Veuillez fournir une URL TikTok valide'
      });
    }

    // Vérification que c'est bien une URL TikTok
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
      return res.status(400).json({ 
        error: 'URL invalide',
        message: 'Veuillez fournir une URL TikTok valide'
      });
    }

    console.log(`Traitement de l'URL: ${url}`);

            let data;
            try {
              // Utilisation de TikWM API (priorité)
              data = await getTikTokVideoTikWM(url);
            } catch (error) {
              console.log('TikWM échoué, tentative avec BOTCAHX');
              try {
                data = await getTikTokVideoBOTCAHX(url);
              } catch (error2) {
                console.log('BOTCAHX échoué, tentative avec API alternative');
                data = await getTikTokVideoReal(url);
              }
            }
    
    if (!data.success && !data.data) {
      throw new Error('Aucune API n\'a pu récupérer les données de la vidéo');
    }

    const videoData = data.data || data;
    console.log('Données vidéo extraites:', videoData);
    
    // Construction de la réponse avec les informations de la vidéo
    const responseData = {
      success: true,
      data: {
        id: videoData.id || Date.now().toString(),
        title: videoData.title || videoData.desc || 'Vidéo TikTok',
        author: {
          username: videoData.author?.unique_id || 'Utilisateur inconnu',
          nickname: videoData.author?.nickname || 'Utilisateur inconnu',
          avatar: videoData.author?.avatar_thumb?.url_list?.[0] || null
        },
        video: {
          url: videoData.video?.download_addr?.url_list?.[0] || videoData.video?.play_addr?.url_list?.[0] || videoData.video?.[0] || videoData.video,
          duration: videoData.duration || 0,
          size: videoData.video?.size || 0,
          quality: 'HD'
        },
        thumbnail: videoData.cover?.url_list?.[0] || videoData.video?.cover?.url_list?.[0] || null,
        stats: {
          likes: videoData.statistics?.digg_count || 0,
          shares: videoData.statistics?.share_count || 0,
          comments: videoData.statistics?.comment_count || 0,
          views: videoData.statistics?.play_count || 0
        },
        downloadUrl: videoData.video?.download_addr?.url_list?.[0] || videoData.video?.play_addr?.url_list?.[0] || videoData.video?.[0] || videoData.video
      }
    };

    // Vérification que l'URL de téléchargement existe
    if (!responseData.data.downloadUrl || responseData.data.downloadUrl === 'undefined') {
      throw new Error('URL de téléchargement non disponible');
    }
    
    console.log('URL de téléchargement validée:', responseData.data.downloadUrl);

    res.json(responseData);

  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    
    // Gestion des erreurs spécifiques
    let errorMessage = 'Erreur lors du téléchargement de la vidéo';
    let statusCode = 500;

    if (error.message.includes('Video not available')) {
      errorMessage = 'Cette vidéo n\'est pas disponible ou a été supprimée';
      statusCode = 404;
    } else if (error.message.includes('Private account')) {
      errorMessage = 'Cette vidéo provient d\'un compte privé';
      statusCode = 403;
    } else if (error.message.includes('Rate limit')) {
      errorMessage = 'Trop de requêtes, veuillez patienter';
      statusCode = 429;
    }

    res.status(statusCode).json({
      error: 'Erreur de téléchargement',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🚀 FONCTION ULTRA-RAPIDE DE RÉSOLUTION D'URLS COURTES AVEC CACHE
async function resolveTikTokUrl(shortUrl) {
  try {
    // Vérifier le cache d'abord
    if (urlCache.has(shortUrl)) {
      const cached = urlCache.get(shortUrl);
      console.log(`🚀 URL courte trouvée dans le cache: ${shortUrl} → ${cached.url}`);
      return cached.url;
    }
    
    console.log(`🔍 Résolution de l'URL courte: ${shortUrl}`);
    
    // Suivre les redirections avec configuration optimisée
    const response = await axios.get(shortUrl, {
      maxRedirects: 3, // Réduit de 10 à 3 pour la vitesse
      timeout: 8000,   // Réduit de 10s à 8s
      httpsAgent: httpsAgent, // Keep-alive pour la vitesse
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const finalUrl = response.request.res.responseUrl || response.config.url;
    
    // Mettre en cache l'URL résolue
    urlCache.set(shortUrl, {
      url: finalUrl,
      timestamp: Date.now()
    });
    
    console.log(`✅ URL résolue et mise en cache: ${finalUrl}`);
    return finalUrl;
  } catch (error) {
    console.log(`❌ Erreur de résolution d'URL: ${error.message}`);
    return shortUrl; // Retourner l'URL originale si la résolution échoue
  }
}

// 🚀 ROUTE ULTRA-RAPIDE DE TÉLÉCHARGEMENT AVEC CACHE VIDÉO
app.get('/api/download/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    let { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }

    console.log(`🚀 Téléchargement proxy ultra-rapide pour: ${url}`);

    // Vérifier le cache vidéo d'abord
    const cacheKey = `${videoId}_${url}`;
    const cachedVideoPath = path.join(CACHE_DIR, `${videoId}.mp4`);
    
    if (fs.existsSync(cachedVideoPath)) {
      console.log(`🚀 Vidéo trouvée dans le cache local: ${cachedVideoPath}`);
      
      const stats = fs.statSync(cachedVideoPath);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="tiktok-${videoId}.mp4"`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1h
      
      // Streamer directement depuis le cache
      const fileStream = fs.createReadStream(cachedVideoPath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('❌ Erreur de lecture du cache:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur de lecture du cache' });
        }
      });
      
      return;
    }

    // Résoudre l'URL courte si nécessaire (avec cache)
    if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
      url = await resolveTikTokUrl(url);
    }

    // Utilisation de TikWM avec cache des métadonnées
    let videoUrl;
    if (metadataCache.has(url)) {
      console.log('🚀 Utilisation des métadonnées en cache');
      const cached = metadataCache.get(url);
      videoUrl = cached.data.downloadUrl;
    } else {
      console.log('🔍 Récupération des métadonnées via TikWM...');
      const tikwmResponse = await axios.get(`https://tikwm.com/api?url=${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 12000,
        httpsAgent: httpsAgent
      });

      if (tikwmResponse.data && tikwmResponse.data.code === 0 && tikwmResponse.data.data) {
        videoUrl = tikwmResponse.data.data.play || tikwmResponse.data.data.wmplay;
      } else {
        throw new Error('TikWM n\'a pas pu récupérer la vidéo');
      }
    }
    
    if (videoUrl) {
      console.log(`🎬 URL vidéo trouvée: ${videoUrl}`);
      
      // Télécharger la vidéo avec streaming optimisé
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.tiktok.com/'
        },
        timeout: 45000, // Réduit de 60s à 45s
        httpsAgent: httpsAgent
      });

      // Créer un stream de passage pour le cache
      const passThrough = new PassThrough();
      const writeStream = fs.createWriteStream(cachedVideoPath);
      
      // Définir les headers pour le téléchargement
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="tiktok-${videoId}.mp4"`);
      res.setHeader('Content-Length', videoResponse.headers['content-length'] || '');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Dupliquer le stream : un vers le client, un vers le cache
      videoResponse.data.pipe(passThrough);
      videoResponse.data.pipe(writeStream);
      passThrough.pipe(res);

      // Gestion des erreurs
      videoResponse.data.on('error', (error) => {
        console.error('❌ Erreur de stream vidéo:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur de téléchargement de la vidéo' });
        }
      });

      writeStream.on('error', (error) => {
        console.error('❌ Erreur d\'écriture du cache:', error);
      });

      writeStream.on('finish', () => {
        console.log(`✅ Vidéo mise en cache: ${cachedVideoPath}`);
      });

    } else {
      throw new Error('Aucune URL vidéo trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur de téléchargement proxy:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erreur de téléchargement',
        message: 'Impossible de télécharger la vidéo',
        debug: error.message
      });
    }
  }
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    message: 'L\'endpoint demandé n\'existe pas'
  });
});

// Gestion globale des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: 'Une erreur inattendue s\'est produite'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur TikTok Downloader démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur: http://localhost:${PORT}/api`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
