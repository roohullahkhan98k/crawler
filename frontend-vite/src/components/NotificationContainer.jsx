import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaCheck, FaExclamationTriangle, FaInfo } from 'react-icons/fa'
import { removeNotification } from '../store/slices/uiSlice'

const NotificationContainer = () => {
  const dispatch = useDispatch()
  const notifications = useSelector(state => state.ui.notifications)

  // Auto-remove notifications after 3 seconds
  useEffect(() => {
    notifications.forEach(notification => {
      setTimeout(() => {
        dispatch(removeNotification(notification.id))
      }, 3000)
    })
  }, [notifications, dispatch])

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheck />
      case 'error':
        return <FaExclamationTriangle />
      case 'warning':
        return <FaExclamationTriangle />
      default:
        return <FaInfo />
    }
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-400'
      case 'error':
        return 'bg-red-500 border-red-400'
      case 'warning':
        return 'bg-yellow-500 border-yellow-400'
      default:
        return 'bg-blue-500 border-blue-400'
    }
  }

  return (
    <div className="notification-container">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            className={`notification ${getTypeStyles(notification.type)}`}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="notification-icon">
              {getIcon(notification.type)}
            </div>
            <div className="notification-content">
              <p className="notification-message">{notification.message}</p>
            </div>
            <button
              className="notification-close"
              onClick={() => dispatch(removeNotification(notification.id))}
            >
              <FaTimes />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default NotificationContainer 