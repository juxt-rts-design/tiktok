import { useState } from 'react'
import axios from 'axios'
import { Download, Link, User, Heart, MessageCircle, Share, Eye, Clock, Loader2, Music, Play, Clipboard, X } from 'lucide-react'
import './App.css'

interface VideoData {
  id: string
  title: string
  author: {
    username: string
    nickname: string
    avatar: string | null
  }
  video: {
    url: string
    duration: number
    size: number
    quality: string
  }
  thumbnail: string | null
  stats: {
    likes: number
    shares: number
    comments: number
    views: number
  }
  downloadUrl: string
  audioUrl?: string
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [error, setError] = useState('')
  const [performance, setPerformance] = useState({ startTime: 0, endTime: 0, duration: 0 })
  const [cacheStats, setCacheStats] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      console.log('📋 Texte collé:', text)
    } catch (err) {
      console.error('❌ Erreur de collage:', err)
      setError('Impossible de coller le texte')
    }
  }

  const handleClear = () => {
    setUrl('')
    setVideoData(null)
    setError('')
    console.log('🗑️ Input effacé')
  }

  const handleDownload = async () => {
    try {
      console.log('Bouton "Télécharger la vidéo" cliqué')
      console.log('URL:', url)
      console.log('URL trim:', url.trim())
      console.log('Loading:', loading)
      
      if (!url.trim()) {
        console.log('URL vide')
        setError('Veuillez entrer une URL TikTok')
        return
      }

      // Mesure de performance
      const startTime = Date.now()
      setPerformance({ startTime, endTime: 0, duration: 0 })
      
      console.log('Mise à jour des états...')
      setLoading(true)
      setError('')
      setVideoData(null)
      console.log('États mis à jour, loading = true')

    try {
      console.log('Début du téléchargement ultra-rapide...')
      console.log('Tentative de connexion au backend...')
      
      // Test simple d'abord
      console.log('Test simple avant requête...')
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('Test simple réussi')
      
      // Test de connexion au backend d'abord
      try {
        console.log('Test de santé du backend...')
        const healthCheck = await axios.get('http://192.168.1.67:3001/api/health')
        console.log('Backend accessible:', healthCheck.data)
      } catch (healthErr) {
        console.error('Backend inaccessible:', healthErr.message)
        setError('Backend non accessible. Vérifiez que le serveur est démarré.')
        return
      }
      
      const response = await axios.post('http://192.168.1.67:3001/api/download', {
        url: url.trim()
      })

      console.log('Réponse reçue du backend:', response.data)

      const endTime = Date.now()
      const duration = Math.round(endTime - startTime)
      
      setPerformance({ startTime, endTime, duration })
      console.log(`Téléchargement terminé en ${duration}ms`)

      if (response.data.success) {
        console.log('Données vidéo reçues:', response.data.data)
        setVideoData(response.data.data)
      } else {
        console.log('Erreur dans la réponse:', response.data.message)
        setError(response.data.message || 'Erreur lors du téléchargement')
      }
    } catch (err: any) {
      console.error('Erreur complète:', err)
      console.error('Message d\'erreur:', err.message)
      console.error('Code d\'erreur:', err.code)
      console.error('Réponse d\'erreur:', err.response?.data)
      setError(err.response?.data?.message || 'Erreur de connexion au serveur')
    } finally {
      console.log('Fin du processus, loading = false')
      setLoading(false)
    }
    } catch (globalErr) {
      console.error('ERREUR GLOBALE dans handleDownload:', globalErr)
      setError('Erreur inattendue: ' + globalErr.message)
      setLoading(false)
    }
  }

  const handleDownloadVideo = async () => {
    console.log('BOUTON CLIQUE - handleDownloadVideo appelé')
    console.log('videoData:', videoData)
    console.log('url:', url)
    
    if (videoData) {
      console.log('videoData existe, début du téléchargement...')
      setDownloading(true)
      setError('')
      
      try {
        console.log('Début du téléchargement vidéo...')
        
        // Utiliser la route proxy ultra-rapide du backend
        const proxyUrl = `http://192.168.1.67:3001/api/download/${videoData.id}?url=${encodeURIComponent(url)}`
        console.log('URL proxy:', proxyUrl)
        
        // Créer un lien de téléchargement optimisé
        const link = document.createElement('a')
        link.href = proxyUrl
        link.download = `tiktok-${videoData.id}.mp4`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        
        // Ajouter des attributs pour la performance
        link.setAttribute('download', `tiktok-${videoData.id}.mp4`)
        link.style.display = 'none'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        console.log('Téléchargement ultra-rapide lancé via proxy')
        
        // Simuler un délai pour l'UI
        setTimeout(() => {
          setDownloading(false)
        }, 2000)
        
      } catch (error) {
        console.error('Erreur de téléchargement proxy:', error)
        setDownloading(false)
        
        // Fallback : téléchargement direct si disponible
        if (videoData.downloadUrl) {
          console.log('Fallback vers téléchargement direct...')
          const link = document.createElement('a')
          link.href = videoData.downloadUrl
          link.download = `tiktok-${videoData.id}.mp4`
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } else {
          console.error('Aucune URL de téléchargement disponible')
          setError('Impossible de télécharger la vidéo')
        }
      }
    } else {
      console.error('Aucune donnée vidéo disponible')
      setError('Aucune vidéo à télécharger')
    }
  }

  const handleDownloadAudio = () => {
    if (videoData?.audioUrl) {
      try {
        console.log('Début du téléchargement audio...')
        
        const link = document.createElement('a')
        link.href = videoData.audioUrl
        link.download = `tiktok-audio-${videoData.id}.mp3`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.style.display = 'none'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        console.log('Téléchargement audio lancé')
      } catch (error) {
        console.error('Erreur de téléchargement audio:', error)
        window.open(videoData.audioUrl, '_blank', 'noopener,noreferrer')
      }
    } else {
      console.error('Aucune URL audio disponible')
      setError('Aucun fichier audio à télécharger')
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <Download className="logo-icon" />
            TikTok Juxt_RTS
          </h1>
          <p className="subtitle">
            Téléchargez vos vidéos TikTok sans filigrane, gratuitement et en haute qualité
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          <div className="download-section">
            {/* Input Section */}
            <div className="input-group">
              <div className="input-wrapper">
                <Link className="input-icon" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Collez votre lien TikTok ici..."
                  className="url-input"
                  disabled={loading}
                />
                <div className="input-actions">
                  <button
                    onClick={handlePaste}
                    disabled={loading}
                    className="paste-btn"
                    title="Coller depuis le presse-papiers"
                  >
                    <Clipboard size={16} />
                  </button>
                  {url && (
                    <button
                      onClick={handleClear}
                      disabled={loading}
                      className="clear-btn"
                      title="Effacer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={loading || !url.trim()}
                className="download-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="spinner" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <Download />
                    Télécharger la vidéo
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <div className="error-dot"></div>
                {error}
              </div>
            )}

            {/* Video Result */}
            {videoData && (
              <div className="video-result">
                {/* Video Preview */}
                <div className="video-preview">
                  {videoData.thumbnail ? (
                    <img
                      src={videoData.thumbnail}
                      alt="Aperçu de la vidéo"
                      className="video-thumbnail"
                    />
                  ) : (
                    <div className="video-placeholder">
                      <Play className="play-icon" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="video-overlay">
                    <div>
                      <button
                        onClick={handleDownloadVideo}
                        className="download-video-btn"
                        disabled={downloading}
                      >
                        <Download />
                        {downloading ? 'Téléchargement...' : 'MP4'}
                      </button>
                      {videoData.audioUrl && (
                        <button
                          onClick={handleDownloadAudio}
                          className="download-audio-btn"
                        >
                          <Music />
                          MP3
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="video-info">
                  {/* 🚀 Indicateur de performance */}
                  {performance.duration > 0 && (
                    <div className="performance-indicator">
                      <span className="performance-badge">
                        ⚡ Traité en {performance.duration}ms
                      </span>
                      {performance.duration < 1000 && (
                        <span className="ultra-fast">🚀 ULTRA-RAPIDE !</span>
                      )}
                    </div>
                  )}
                  
                  {/* Title */}
                  <h3 className="video-title">{videoData.title}</h3>
                  
                  {/* Author */}
                  <div className="author-info">
                    {videoData.author.avatar ? (
                      <img
                        src={videoData.author.avatar}
                        alt={videoData.author.username}
                        className="author-avatar"
                      />
                    ) : (
                      <div className="author-placeholder">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="author-username">@{videoData.author.username}</p>
                      <p className="author-nickname">{videoData.author.nickname}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="video-stats">
                    <div className="stat">
                      <div className="stat-header">
                        <Heart className="stat-icon text-red-400" />
                        <span className="text-sm font-medium">Likes</span>
                      </div>
                      <p className="stat-value">{formatNumber(videoData.stats.likes)}</p>
                    </div>
                    <div className="stat">
                      <div className="stat-header">
                        <MessageCircle className="stat-icon text-blue-400" />
                        <span className="text-sm font-medium">Comments</span>
                      </div>
                      <p className="stat-value">{formatNumber(videoData.stats.comments)}</p>
                    </div>
                    <div className="stat">
                      <div className="stat-header">
                        <Share className="stat-icon text-green-400" />
                        <span className="text-sm font-medium">Shares</span>
                      </div>
                      <p className="stat-value">{formatNumber(videoData.stats.shares)}</p>
                    </div>
                    <div className="stat">
                      <div className="stat-header">
                        <Eye className="stat-icon text-purple-400" />
                        <span className="text-sm font-medium">Views</span>
                      </div>
                      <p className="stat-value">{formatNumber(videoData.stats.views)}</p>
                    </div>
                    <div className="stat">
                      <div className="stat-header">
                        <Clock className="stat-icon text-yellow-400" />
                        <span className="text-sm font-medium">Duration</span>
                      </div>
                      <p className="stat-value">{formatDuration(videoData.video.duration)}</p>
                    </div>
                  </div>

                  {/* Quality & Size */}
                  <div className="video-quality">
      <div>
                      <span className="quality-badge">{videoData.video.quality}</span>
                    </div>
                    <span className="file-size">
                      {videoData.video.size > 0 
                        ? `${(videoData.video.size / 1024 / 1024).toFixed(1)} MB`
                        : 'Taille inconnue'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="features">
            <h2>Pourquoi choisir notre téléchargeur ?</h2>
            <div className="features-grid">
              <div className="feature">
                <div className="feature-icon">🚫</div>
                <h3>Aucun filigrane</h3>
                <p>Téléchargez vos vidéos TikTok sans le logo TikTok</p>
              </div>
              <div className="feature">
                <div className="feature-icon">⚡</div>
                <h3>Rapide et gratuit</h3>
                <p>Téléchargement instantané et entièrement gratuit</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📱</div>
                <h3>Qualité HD</h3>
                <p>Vidéos en haute qualité, compatibles tous appareils</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🔒</div>
                <h3>Sécurisé</h3>
                <p>Vos données sont protégées, aucune inscription requise</p>
              </div>
            </div>
          </div>
      </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2025 TikTok Juxt_RTS - Outil personnel de téléchargement</p>
            <p className="disclaimer">
              Cet outil est destiné à un usage personnel uniquement. 
              Respectez les droits d'auteur et les conditions d'utilisation de TikTok.
        </p>
      </div>
        </div>
      </footer>
    </div>
  )
}

export default App