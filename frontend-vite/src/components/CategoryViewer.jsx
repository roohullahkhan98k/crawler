import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaDownload, FaPlay, FaSpinner, FaCheck, FaTimesCircle, FaWifi } from 'react-icons/fa'
import { getStatusIndicator, getStatusText } from '../utils/categorization'

const CategoryViewer = ({ 
  category, 
  streams,
  streamStatus, 
  streamPreloaded,
  onPlayStream, 
  onDownload, 
  onSingleStreamValidation, 
  onClose
}) => {
  // Handle both object and string category formats
  const categoryName = typeof category === 'object' ? category.name : category
  const categoryStreams = streams || (typeof category === 'object' ? category.streams : [])
  
  // Simple filtering logic if filterStreamsByStatus is not provided
  const filteredStreams = categoryStreams || []

  const getStatusIndicator = (url, streamStatus) => {
    const status = streamStatus[url]
    const isPreloaded = streamPreloaded[url]
    
    if (status === 'working') {
      return {
        icon: 'check',
        className: 'working',
        title: isPreloaded ? 'Working - Pre-loaded for instant playback!' : 'Working'
      }
    } else if (status === 'broken') {
      return {
        icon: 'times-circle',
        className: 'broken',
        title: 'Marked as broken - but you can still test it!'
      }
    } else if (status === 'checking') {
      return {
        icon: 'spinner',
        className: 'checking',
        title: 'Checking stream...'
      }
    } else {
      return {
        icon: 'wifi',
        className: 'unknown',
        title: 'Not scanned yet - you can test it anyway!'
      }
    }
  }

  const getStatusText = (url, streamStatus) => {
    const status = streamStatus[url]
    const isPreloaded = streamPreloaded[url]
    
    if (status === 'working') {
      return isPreloaded ? 'Ready to Play' : 'Working'
    } else if (status === 'broken') {
      return 'Marked as Broken (Test Anyway)'
    } else if (status === 'checking') {
      return 'Checking...'
    } else {
      return 'Not Scanned (Test Anyway)'
    }
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="category-viewer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="category-viewer-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="category-header">
            <h3>{categoryName} - All Streams ({filteredStreams.length})</h3>
            <motion.button 
              className="close-btn"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes />
            </motion.button>
          </div>
          
          <div className="streams-grid">
            <AnimatePresence>
              {filteredStreams.map((stream, index) => {
                const statusIndicator = getStatusIndicator(stream.url, streamStatus)
                const isBroken = streamStatus[stream.url] === 'broken'
                
                return (
                  <motion.div 
                    key={index} 
                    className="stream-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div className="stream-info">
                      <h4>{stream.name}</h4>
                      <p className="stream-url">{stream.url}</p>
                      <div className="stream-status">
                        {statusIndicator.icon === 'check' && <FaCheck className={`status-icon ${statusIndicator.className}`} title={statusIndicator.title} />}
                        {statusIndicator.icon === 'times-circle' && <FaTimesCircle className={`status-icon ${statusIndicator.className}`} title={statusIndicator.title} />}
                        {statusIndicator.icon === 'spinner' && <FaSpinner className={`status-icon ${statusIndicator.className}`} title={statusIndicator.title} />}
                        {statusIndicator.icon === 'wifi' && <FaWifi className={`status-icon ${statusIndicator.className}`} title={statusIndicator.title} />}
                        <span className="status-text">{getStatusText(stream.url, streamStatus)}</span>
                      </div>
                    </div>
                    
                    <div className="stream-actions">
                      <motion.button 
                        className="play-btn"
                        onClick={() => onPlayStream(stream)}
                        title="Play this stream (test even if marked as broken)"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaPlay />
                      </motion.button>
                      <motion.button 
                        className="scan-btn"
                        onClick={() => onSingleStreamValidation(stream.url)}
                        title="Scan this stream"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaSpinner />
                      </motion.button>
                      <motion.button 
                        className="download-btn"
                        onClick={() => onDownload([stream], categoryName)}
                        title="Download this stream"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaDownload />
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          
          <div className="category-footer">
            <motion.button 
              className="download-all-btn"
              onClick={() => onDownload(filteredStreams, categoryName)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaDownload /> Download All ({filteredStreams.length})
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CategoryViewer 