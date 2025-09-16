import { useState } from 'react'
import axios from 'axios'
import { Download, Link, User, Heart, MessageCircle, Share, Eye, Clock, Loader2, Music, Play } from 'lucide-react'
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

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Veuillez entrer une URL TikTok')
      return
    }

    setLoading(true)
    setError('')
    setVideoData(null)

    try {
      const response = await axios.post('http://localhost:3001/api/download', {
        url: url.trim()
      })

      if (response.data.success) {
        setVideoData(response.data.data)
      } else {
        setError(response.data.message || 'Erreur lors du téléchargement')
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.response?.data?.message || 'Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadVideo = async () => {
    if (videoData?.downloadUrl) {
      try {
        // Utiliser la route proxy du backend pour télécharger la vidéo complète
        const proxyUrl = `http://localhost:3001/api/download/${videoData.id}?url=${encodeURIComponent(url)}`
        const link = document.createElement('a')
        link.href = proxyUrl
        link.download = `tiktok-${videoData.id}.mp4`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        console.error('Erreur de téléchargement proxy:', error)
        // Fallback : téléchargement direct
        const link = document.createElement('a')
        link.href = videoData.downloadUrl
        link.download = `tiktok-${videoData.id}.mp4`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }

  const handleDownloadAudio = () => {
    if (videoData?.audioUrl) {
      try {
        const link = document.createElement('a')
        link.href = videoData.audioUrl
        link.download = `tiktok-audio-${videoData.id}.mp3`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        console.error('Erreur de téléchargement audio:', error)
        window.open(videoData.audioUrl, '_blank', 'noopener,noreferrer')
      }
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
            TikTok Downloader
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
                {url && (
                  <button
                    onClick={() => setUrl('')}
                    disabled={loading}
                    className="clear-btn"
                  >
                    ×
                  </button>
                )}
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
                      >
                        <Download />
                        MP4
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
            <p>&copy; 2024 TikTok Downloader - Outil personnel de téléchargement</p>
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