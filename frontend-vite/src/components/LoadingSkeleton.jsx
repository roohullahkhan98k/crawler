import { motion } from 'framer-motion'
import { FaSpinner } from 'react-icons/fa'

const LoadingSkeleton = () => {
  return (
    <motion.div 
      className="loading-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-content">
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FaSpinner />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Crawling IPTV Streams...
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Please wait while we extract and categorize your streams
        </motion.p>
        
        <div className="loading-bars">
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              className="loading-bar"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: index * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default LoadingSkeleton 