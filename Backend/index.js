const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const path = require('path');

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

// Fonction pour utiliser une API qui fonctionne vraiment
async function getTikTokVideoReal(url) {
  console.log('Tentative de récupération réelle pour:', url);
  
  // Résoudre l'URL courte si nécessaire
  let finalUrl = url;
  if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
    console.log('Résolution de l\'URL courte TikTok...');
    try {
      const response = await axios.get(url, {
        maxRedirects: 10,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      finalUrl = response.request.res.responseUrl || response.config.url;
      console.log('URL résolue:', finalUrl);
    } catch (redirectError) {
      console.log('Erreur de résolution d\'URL, utilisation de l\'URL originale');
    }
  }

  // Utilisation de l'API TikWM uniquement
  try {
    console.log('Tentative avec TikWM...');
    const tikwmResponse = await axios.get(`https://tikwm.com/api?url=${encodeURIComponent(finalUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    console.log('Réponse TikWM:', JSON.stringify(tikwmResponse.data, null, 2));
    
    if (tikwmResponse.data && tikwmResponse.data.code === 0 && tikwmResponse.data.data) {
      const data = tikwmResponse.data.data;
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
    } else {
      throw new Error(`TikWM a retourné une erreur: ${JSON.stringify(tikwmResponse.data)}`);
    }
  } catch (tikwmError) {
    console.error('Erreur TikWM:', tikwmError.message);
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

// Fonction pour résoudre les URLs courtes TikTok
async function resolveTikTokUrl(shortUrl) {
  try {
    console.log(`Résolution de l'URL courte: ${shortUrl}`);
    
    // Suivre les redirections pour obtenir l'URL complète
    const response = await axios.get(shortUrl, {
      maxRedirects: 10,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const finalUrl = response.request.res.responseUrl || response.config.url;
    console.log(`URL résolue: ${finalUrl}`);
    return finalUrl;
  } catch (error) {
    console.log(`Erreur de résolution d'URL: ${error.message}`);
    return shortUrl; // Retourner l'URL originale si la résolution échoue
  }
}

// Route pour télécharger directement un fichier via proxy
app.get('/api/download/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    let { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }

    console.log(`Téléchargement proxy pour: ${url}`);

    // Résoudre l'URL courte si nécessaire
    if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
      url = await resolveTikTokUrl(url);
    }

    // Utilisation de TikWM uniquement
    try {
      console.log('Tentative avec TikWM...');
      const tikwmResponse = await axios.get(`https://tikwm.com/api?url=${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      console.log('Réponse TikWM:', JSON.stringify(tikwmResponse.data, null, 2));

      if (tikwmResponse.data && tikwmResponse.data.code === 0 && tikwmResponse.data.data) {
        const videoUrl = tikwmResponse.data.data.play || tikwmResponse.data.data.wmplay;
        
        if (videoUrl) {
          console.log(`URL vidéo TikWM trouvée: ${videoUrl}`);
          
          // Télécharger la vidéo depuis TikTok
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'stream',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://www.tiktok.com/',
              'Accept': 'video/mp4,video/*,*/*'
            },
            timeout: 60000
          });

          // Définir les headers pour le téléchargement
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Content-Disposition', `attachment; filename="tiktok-${videoId}.mp4"`);
          res.setHeader('Content-Length', videoResponse.headers['content-length'] || '');
          res.setHeader('Cache-Control', 'no-cache');

          // Streamer la vidéo vers le client
          videoResponse.data.pipe(res);

          videoResponse.data.on('error', (error) => {
            console.error('Erreur de stream vidéo TikWM:', error);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Erreur de téléchargement de la vidéo' });
            }
          });

          return;
        } else {
          console.log('Aucune URL vidéo trouvée dans TikWM');
        }
      } else {
        console.log('TikWM a retourné une erreur:', tikwmResponse.data);
      }
    } catch (tikwmError) {
      console.log('Erreur TikWM:', tikwmError.message);
    }

    console.log('TikWM a échoué');
    res.status(404).json({ 
      error: 'Vidéo non trouvée',
      message: 'TikWM n\'a pas pu récupérer la vidéo',
      debug: {
        url: url,
        videoId: videoId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur de téléchargement proxy:', error);
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
