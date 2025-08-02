import { motion } from 'framer-motion'
import { FaGlobe, FaFilter, FaPlay, FaSpinner, FaShieldAlt, FaBolt, FaRocket } from 'react-icons/fa'

const CrawlerForm = ({ url, filter, loading, validationMode, scanMode, onUrlChange, onFilterChange, onValidationModeChange, onScanModeChange, onCrawl }) => {
  return (
    <motion.div 
      className="crawler-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="form-container">
        <motion.div 
          className="form-group"
          whileHover={{ scale: 1.02 }}
        >
          <label htmlFor="url">
            <FaGlobe /> URL to Crawl
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://example.com/iptv-playlist.m3u"
            disabled={loading}
            className="form-input"
          />
        </motion.div>

        <motion.div 
          className="form-group"
          whileHover={{ scale: 1.02 }}
        >
          <label htmlFor="filter">
            <FaFilter /> Filter (Optional)
          </label>
          <input
            type="text"
            id="filter"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="sports, football, news, etc."
            disabled={loading}
            className="form-input"
          />
        </motion.div>

        <motion.div 
          className="form-group"
          whileHover={{ scale: 1.02 }}
        >
          <label htmlFor="validationMode">
            <FaShieldAlt /> Validation Mode
          </label>
          <select
            id="validationMode"
            value={validationMode}
            onChange={(e) => onValidationModeChange(e.target.value)}
            disabled={loading}
            className="form-input"
          >
            <option value="lenient">Lenient - Show most streams as working</option>
            <option value="strict">Strict - Only show definitely working streams</option>
            <option value="disabled">Disabled - Show all streams as working</option>
          </select>
          <small className="form-help">
            Lenient mode is recommended for most users. Disabled mode shows all streams regardless of validation.
          </small>
        </motion.div>

        <motion.div 
          className="form-group"
          whileHover={{ scale: 1.02 }}
        >
          <label htmlFor="scanMode">
            <FaBolt /> Scan Mode
          </label>
          <select
            id="scanMode"
            value={scanMode}
            onChange={(e) => onScanModeChange(e.target.value)}
            disabled={loading}
            className="form-input"
          >
            <option value="quick">⚡ Quick Scan - Fast, just check working/broken</option>
            <option value="preload">🚀 Pre-load Scan - Slower, but streams ready to play instantly</option>
          </select>
          <small className="form-help">
            Quick scan is fast but streams need to load when played. Pre-load scan takes longer but streams play instantly.
          </small>
        </motion.div>

        <motion.button 
          className="crawl-btn"
          onClick={onCrawl} 
          disabled={loading || !url.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          whileDisabled={{ scale: 0.95, opacity: 0.6 }}
        >
          {loading ? (
            <>
              <FaSpinner className="loader" /> Crawling...
            </>
          ) : (
            <>
              <FaPlay /> Start Crawling
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default CrawlerForm 