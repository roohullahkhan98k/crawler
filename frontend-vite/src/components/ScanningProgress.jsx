import { motion, AnimatePresence } from 'framer-motion'
import { FaSpinner, FaCheck, FaTimes, FaBolt, FaRocket } from 'react-icons/fa'

const ScanningProgress = ({ 
  isScanning, 
  categoryName, 
  progress, 
  totalStreams, 
  validatedCount,
  scanMode,
  onCancel 
}) => {
  if (!isScanning) return null

  const percentage = totalStreams > 0 ? Math.round((validatedCount / totalStreams) * 100) : 0
  const remainingStreams = totalStreams - validatedCount

  const isQuickScan = scanMode === 'quick'
  const scanIcon = isQuickScan ? <FaBolt /> : <FaRocket />
  const scanTitle = isQuickScan ? 'Quick Scanning Category' : 'Pre-load Scanning Category'
  const scanDescription = isQuickScan 
    ? 'Fast scan - checking if streams are working' 
    : 'Pre-loading streams for instant playback'

  return (
    <AnimatePresence>
      <motion.div 
        className="scanning-progress-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="scanning-progress-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="scanning-header">
            <div className="scanning-icon">
              <FaSpinner className="spinning-icon" />
            </div>
            <h3>{scanTitle}</h3>
            <p className="category-name">{categoryName}</p>
            <p className="scan-description">{scanDescription}</p>
          </div>
          
          <div className="scanning-details">
            <div className="progress-info">
              <span className="progress-text">
                {validatedCount} of {totalStreams} streams scanned
              </span>
              <span className="progress-percentage">{percentage}%</span>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-bar">
                <motion.div 
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            
            <div className="scanning-stats">
              <div className="stat-item">
                <FaCheck className="stat-icon success" />
                <span>Working: {Math.round(progress * totalStreams / 100)}</span>
              </div>
              <div className="stat-item">
                <FaTimes className="stat-icon error" />
                <span>Broken: {Math.round((100 - progress) * totalStreams / 100)}</span>
              </div>
              <div className="stat-item">
                <FaSpinner className="stat-icon loading" />
                <span>Remaining: {remainingStreams}</span>
              </div>
            </div>
          </div>
          
          <div className="scanning-actions">
            <motion.button 
              className="cancel-scan-btn"
              onClick={onCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel Scan
            </motion.button>
          </div>
          
          <div className="scanning-tips">
            {isQuickScan ? (
              <>
                <p>⚡ Quick scan - fast but streams need to load when played</p>
                <p>💡 Click individual streams to pre-load them for instant playback</p>
              </>
            ) : (
              <>
                <p>🚀 Pre-loading streams for instant playback</p>
                <p>⏱️ This may take a few minutes for large playlists</p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ScanningProgress 