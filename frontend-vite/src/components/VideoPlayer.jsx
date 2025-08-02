import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaTimes, 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
  FaStepForward,
  FaStepBackward,
  FaRedo
} from 'react-icons/fa'
import Hls from 'hls.js'

const VideoPlayer = ({ stream, onClose }) => {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPreloaded, setIsPreloaded] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [currentUrl, setCurrentUrl] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  
  const progressRef = useRef(null)
  const controlsTimeoutRef = useRef(null)

  // Get proxy URL for video
  const getProxyUrl = (url) => {
    return `http://localhost:5000/proxy-video?url=${encodeURIComponent(url)}`
  }

  // Try multiple URL strategies like VLC/XUI panel for live streams
  const getVideoUrl = (url, strategy = 0) => {
    switch (strategy) {
      case 0:
        return getProxyUrl(url) // Try proxy first (like VLC)
      case 1:
        return url // Try direct URL
      case 2:
        // Try with different proxy headers
        return `${getProxyUrl(url)}&headers=true`
      case 3:
        // Try with VLC user agent
        return `${getProxyUrl(url)}&vlc=true`
      default:
        return url
    }
  }

  const videoUrl = getVideoUrl(stream.url, retryCount)

  // Auto-play when component mounts
  useEffect(() => {
    if (videoRef.current) {
      const currentVideoUrl = getVideoUrl(stream.url, retryCount)
      const isLiveStream = stream.url.includes('live') || stream.url.includes('tv') || stream.name?.toLowerCase().includes('live')
      
      setDebugInfo(`Trying: ${currentVideoUrl} (${isLiveStream ? 'Live Stream' : 'VOD'})`)
      console.log(`Loading video with URL: ${currentVideoUrl}`)
      
      // Check if HLS is supported
      if (Hls.isSupported()) {
        console.log('Using HLS.js for stream playback')
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        })
        
        hls.loadSource(currentVideoUrl)
        hls.attachMedia(videoRef.current)
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed successfully')
          setIsLoading(false)
          setError(null)
          
          // Try to play
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                setIsPlaying(true)
                setDebugInfo(`HLS stream loaded successfully! (${isLiveStream ? 'Live' : 'VOD'})`)
              }).catch((err) => {
                console.warn('HLS auto-play failed:', err)
                setDebugInfo(`HLS loaded but auto-play failed (${isLiveStream ? 'Live' : 'VOD'})`)
              })
            }
          }, 500)
        })
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data)
          if (data.fatal) {
            setError(`HLS Error: ${data.details}`)
            setIsLoading(false)
          }
        })
        
        // Cleanup HLS on unmount
        return () => {
          hls.destroy()
        }
      } else {
        // Fallback to native video element
        console.log('HLS not supported, using native video element')
        videoRef.current.load()
        
        const playDelay = isLiveStream ? 1000 : 500
        const playTimer = setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsPlaying(true)
              setIsLoading(false)
              setDebugInfo(`Stream loaded successfully! (${isLiveStream ? 'Live' : 'VOD'})`)
            }).catch((err) => {
              console.warn('Auto-play failed:', err)
              setIsLoading(false)
              setDebugInfo(`Auto-play failed, but stream may be loaded (${isLiveStream ? 'Live' : 'VOD'})`)
            })
          }
        }, playDelay)
        
        return () => clearTimeout(playTimer)
      }
    }
  }, [stream.url, retryCount])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return
      
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          seekForward()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekBackward()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          if (error) {
            handleRefresh()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, volume])

  // Mouse movement to show/hide controls
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const seekForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration)
    }
  }

  const seekBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setVolume(videoRef.current.muted ? 0 : 1)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      videoRef.current.muted = newVolume === 0
    }
  }

  const handleProgressClick = (e) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = clickX / rect.width
      videoRef.current.currentTime = percentage * duration
    }
  }

  const handleVideoError = (e) => {
    console.error('Video error:', e)
    
    // Check if it's a live stream issue
    const isLiveStream = stream.url.includes('live') || stream.url.includes('tv') || stream.name?.toLowerCase().includes('live')
    
    // Try different strategies like VLC for live streams
    if (retryCount < 4) {
      const nextStrategy = retryCount + 1
      console.log(`Trying strategy ${nextStrategy} for ${isLiveStream ? 'live stream' : 'VOD'}...`)
      setRetryCount(nextStrategy)
      setError(null)
      setIsLoading(true)
      
      // Reload video with new URL strategy
      if (videoRef.current) {
        const newUrl = getVideoUrl(stream.url, nextStrategy)
        console.log(`Trying URL: ${newUrl}`)
        
        // If HLS is supported, try with HLS.js
        if (Hls.isSupported()) {
          const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          })
          
          hls.loadSource(newUrl)
          hls.attachMedia(videoRef.current)
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest parsed successfully on retry')
            setIsLoading(false)
            setError(null)
            
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {})
              }
            }, 500)
          })
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error on retry:', data)
            if (data.fatal) {
              setError(`HLS Error: ${data.details}`)
              setIsLoading(false)
            }
          })
        } else {
          // Fallback to native video element
          videoRef.current.src = newUrl
          videoRef.current.load()
          
          if (isLiveStream) {
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {})
              }
            }, 1000)
          }
        }
      }
    } else {
      const errorMsg = isLiveStream 
        ? 'Failed to load live stream. Live streams may require specific headers or user agents. Try opening in VLC.'
        : 'Failed to load video stream after multiple attempts. Try opening in VLC.'
      setError(errorMsg)
      setIsLoading(false)
    }
  }

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration)
    setIsLoading(false)
    setError(null)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleRefresh = () => {
    // Reset state and try again
    setRetryCount(0)
    setError(null)
    setIsLoading(true)
    setIsPlaying(false)
    
    if (videoRef.current) {
      const newUrl = getVideoUrl(stream.url, 0)
      
      // If HLS is supported, use HLS.js
      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        })
        
        hls.loadSource(newUrl)
        hls.attachMedia(videoRef.current)
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed successfully on refresh')
          setIsLoading(false)
          setError(null)
          
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {})
            }
          }, 500)
        })
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error on refresh:', data)
          if (data.fatal) {
            setError(`HLS Error: ${data.details}`)
            setIsLoading(false)
          }
        })
      } else {
        // Fallback to native video element
        videoRef.current.src = newUrl
        videoRef.current.load()
        
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {})
          }
        }, 500)
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="video-player-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="video-player-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          onMouseMove={handleMouseMove}
        >
          <div className="video-header">
            <h3>{stream.name || 'Video Stream'}</h3>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          
          <div className="video-container">
            <div className="video-wrapper">
              {isLoading && (
                <div className="video-loading">
                  <div className="mini-spinner"></div>
                  <p>Loading stream...</p>
                </div>
              )}
              
                             {error && (
                 <div className="video-error">
                   <div className="error-icon">⚠️</div>
                   <p>{error}</p>
                   <p className="stream-url">{stream.url}</p>
                   <p className="debug-info">{debugInfo}</p>
                   <button className="refresh-btn" onClick={handleRefresh}>
                     <FaRedo /> Refresh Stream
                   </button>
                 </div>
               )}
              
                             <video
                 ref={videoRef}
                 src={videoUrl}
                 preload="metadata"
                 onLoadedMetadata={handleLoadedMetadata}
                 onTimeUpdate={handleTimeUpdate}
                 onError={handleVideoError}
                 onPlay={() => setIsPlaying(true)}
                 onPause={() => setIsPlaying(false)}
                 onLoadStart={() => setIsLoading(true)}
                 onCanPlay={() => setIsLoading(false)}
                 onCanPlayThrough={() => setIsLoading(false)}
                 onWaiting={() => setIsLoading(true)}
                 onStalled={() => setIsLoading(true)}
                 onLoadedData={() => setIsLoading(false)}
                 onSuspend={() => setIsLoading(false)}
                 onAbort={() => setIsLoading(false)}
                 onEmptied={() => setIsLoading(true)}
                 muted={volume === 0}
                 style={{ 
                   display: error ? 'none' : 'block',
                   width: '100%',
                   height: '100%',
                   objectFit: 'contain',
                   backgroundColor: '#000'
                 }}
                 controls={false}
                 playsInline
                 webkit-playsinline="true"
                 x5-playsinline="true"
                 x5-video-player-type="h5"
                 x5-video-player-fullscreen="true"
                 autoplay
                 loop={false}
                 poster=""
                 crossOrigin="anonymous"
               />
            </div>
          </div>
          
          <AnimatePresence>
            {showControls && (
              <motion.div 
                className="video-controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Progress Bar */}
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    ref={progressRef}
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="progress-fill"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    <div 
                      className="progress-handle"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                
                {/* Control Buttons */}
                <div className="control-buttons">
                  <button onClick={seekBackward} className="control-btn">
                    <FaStepBackward />
                  </button>
                  
                  <button onClick={togglePlay} className="control-btn play-btn">
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  
                  <button onClick={seekForward} className="control-btn">
                    <FaStepForward />
                  </button>
                  
                  {/* Volume Control */}
                  <div 
                    className="volume-control"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button onClick={toggleMute} className="control-btn">
                      {volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                    
                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div 
                          className="volume-slider"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="volume-range"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default VideoPlayer 