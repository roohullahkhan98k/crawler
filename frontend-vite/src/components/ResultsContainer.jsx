import { motion, AnimatePresence } from 'framer-motion'
import { FaDownload, FaEye, FaPlay, FaSpinner, FaCheck, FaTimesCircle, FaWifi } from 'react-icons/fa'
import { getStatusIndicator, getStatusText } from '../utils/categorization'

const ResultsContainer = ({ 
  categorizedStreams, 
  streamStatus, 
  streamPreloaded,
  onCategoryValidation, 
  onSingleStreamValidation,
  onPlayStream, 
  onOpenCategoryViewer, 
  onDownload,
  selectedFilter,
  onFilterChange,
  filterStreamsByStatus 
}) => {
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
        title: 'Broken stream'
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
        title: 'Unknown status'
      }
    }
  }

  const getStatusText = (url, streamStatus) => {
    const status = streamStatus[url]
    const isPreloaded = streamPreloaded[url]
    
    if (status === 'working') {
      return isPreloaded ? 'Ready to Play' : 'Working'
    } else if (status === 'broken') {
      return 'Broken'
    } else if (status === 'checking') {
      return 'Checking...'
    } else {
      return 'Unknown'
    }
  }

  const totalStreams = Object.values(categorizedStreams).reduce((sum, streams) => sum + streams.length, 0)
  const totalCategories = Object.keys(categorizedStreams).length

  return (
    <motion.div 
      className="results-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="stats">
        <motion.div 
          className="stat-item"
          whileHover={{ scale: 1.05 }}
        >
          <div className="stat-number">{totalCategories}</div>
          <div className="stat-label">Auto-Detected Categories</div>
        </motion.div>
        <motion.div 
          className="stat-item"
          whileHover={{ scale: 1.05 }}
        >
          <div className="stat-number">{totalStreams}</div>
          <div className="stat-label">Total Streams</div>
        </motion.div>
      </div>

      <div className="filter-controls">
        <motion.button 
          className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          All ({totalStreams})
        </motion.button>
        <motion.button 
          className={`filter-btn ${selectedFilter === 'working' ? 'active' : ''}`}
          onClick={() => onFilterChange('working')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Working ({Object.values(categorizedStreams).flat().filter(s => streamStatus[s.url] === 'working').length})
        </motion.button>
        <motion.button 
          className={`filter-btn ${selectedFilter === 'broken' ? 'active' : ''}`}
          onClick={() => onFilterChange('broken')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Broken ({Object.values(categorizedStreams).flat().filter(s => streamStatus[s.url] === 'broken').length})
        </motion.button>
      </div>

      <div className="categories-grid">
        <AnimatePresence>
          {Object.entries(categorizedStreams)
            .filter(([category, streams]) => streams.length > 0)
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([category, streams]) => (
              <motion.div 
                key={category} 
                className="category-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="category-header">
                  <div className="category-name">{category}</div>
                  <div className="category-count">{streams.length}</div>
                </div>
                
                <div className="streams-list">
                  {streams.slice(0, 5).map((stream, index) => {
                    const statusIndicator = getStatusIndicator(stream.url, streamStatus)
                    const isBroken = streamStatus[stream.url] === 'broken'
                    
                    return (
                      <motion.div 
                        key={index} 
                        className={`stream-item ${isBroken ? 'broken-stream' : ''}`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="stream-info">
                          <div className="stream-name" title={stream.name}>
                            {stream.name.length > 30 ? stream.name.substring(0, 30) + '...' : stream.name}
                          </div>
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
                            title="Play this stream"
                            disabled={isBroken}
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
                        </div>
                      </motion.div>
                    )
                  })}
                  {streams.length > 5 && (
                    <div className="stream-item">
                      <div className="stream-name">
                        ... and {streams.length - 5} more streams
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="category-actions">
                  <motion.button 
                    className="view-category-btn"
                    onClick={() => onOpenCategoryViewer(category, streams)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaEye /> View All ({streams.length})
                  </motion.button>
                  <motion.button 
                    className="scan-category-btn"
                    onClick={() => onCategoryValidation(category, streams)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaSpinner /> Scan All
                  </motion.button>
                  <motion.button 
                    className="download-all-btn"
                    onClick={() => onDownload(streams, category)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaDownload /> Download All
                  </motion.button>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default ResultsContainer 