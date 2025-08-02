import { motion } from 'framer-motion'
import { FaPlay, FaGlobe, FaCog } from 'react-icons/fa'

const Header = () => {
  return (
    <motion.header 
      className="header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-content">
        <motion.div 
          className="logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaPlay className="logo-icon" />
          <h1>Smart IPTV Crawler</h1>
        </motion.div>
        
        <div className="header-actions">
          <motion.button 
            className="settings-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Settings"
          >
            <FaCog />
          </motion.button>
        </div>
      </div>
      
      <motion.p 
        className="header-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Extract, validate, and intelligently categorize IPTV streams from any URL
      </motion.p>
    </motion.header>
  )
}

export default Header 