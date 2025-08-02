import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  crawlStreams, 
  setUrl, 
  setFilter, 
  clearError, 
  clearSuccess,
  setCategorizedStreams 
} from './store/slices/crawlerSlice'
import { 
  openCategoryViewer, 
  setSelectedFilter,
  addNotification, 
  closeCategoryViewer 
} from './store/slices/uiSlice'
import { 
  validateStreams, 
  quickValidateStreams,
  startCategoryValidation, 
  setValidationMode, 
  completeCategoryValidation,
  setScanMode
} from './store/slices/validationSlice'
import { openPlayer, closePlayer } from './store/slices/playerSlice'
import { categorizeStreams, downloadM3U, filterStreamsByStatus } from './utils/categorization'
import Header from './components/Header'
import CrawlerForm from './components/CrawlerForm'
import ResultsContainer from './components/ResultsContainer'
import VideoPlayer from './components/VideoPlayer'
import CategoryViewer from './components/CategoryViewer'
import NotificationContainer from './components/NotificationContainer'
import LoadingSkeleton from './components/LoadingSkeleton'
import ScanningProgress from './components/ScanningProgress'
import './App.css'

function App() {
  const dispatch = useDispatch()
  const { 
    url, 
    filter, 
    loading, 
    error, 
    success, 
    results, 
    categorizedStreams 
  } = useSelector(state => state.crawler)
  
  const { showPlayer, currentStream } = useSelector(state => state.player)
  const { showCategoryViewer, selectedCategory, selectedFilter } = useSelector(state => state.ui)
  const { 
    streamStatus, 
    streamPreloaded,
    validatingStreams, 
    validationProgress, 
    validationMode,
    scanMode,
    currentScanningCategory,
    totalToValidate,
    validatedCount
  } = useSelector(state => state.validation)

  // Handle validation mode change
  const handleValidationModeChange = (mode) => {
    dispatch(setValidationMode(mode))
    dispatch(addNotification({ 
      type: 'info', 
      message: `Validation mode changed to: ${mode}` 
    }))
  }

  // Handle scan mode change
  const handleScanModeChange = (mode) => {
    dispatch(setScanMode(mode))
    dispatch(addNotification({ 
      type: 'info', 
      message: `Scan mode changed to: ${mode === 'quick' ? 'Quick Scan' : 'Pre-load Scan'}` 
    }))
  }

  // Handle crawling
  const handleCrawl = async () => {
    if (!url.trim()) {
      dispatch(addNotification({ 
        type: 'error', 
        message: 'Please enter a URL' 
      }))
      return
    }

    try {
      const result = await dispatch(crawlStreams({ url, filter })).unwrap()
      
      // Categorize streams
      const categorized = categorizeStreams(result.streams)
      dispatch(setCategorizedStreams(categorized))
      
      dispatch(addNotification({ 
        type: 'success', 
        message: `Successfully extracted ${result.total_streams} streams` 
      }))
    } catch (error) {
      dispatch(addNotification({ 
        type: 'error', 
        message: error 
      }))
    }
  }

  // Handle category validation with scan mode
  const handleCategoryValidation = async (category, streams) => {
    dispatch(startCategoryValidation({ 
      category, 
      totalStreams: streams.length,
      scanMode 
    }))
    
    try {
      if (scanMode === 'quick') {
        // Quick scan - just check if working/broken
        await dispatch(quickValidateStreams(streams)).unwrap()
        dispatch(completeCategoryValidation(category))
        dispatch(addNotification({ 
          type: 'success', 
          message: `Quick scan completed for ${category}. Click individual streams to pre-load them.` 
        }))
      } else {
        // Pre-load scan - check + pre-load for instant playback
        await dispatch(validateStreams(streams)).unwrap()
        dispatch(completeCategoryValidation(category))
        dispatch(addNotification({ 
          type: 'success', 
          message: `Pre-load scan completed for ${category}. Streams are now ready for instant playback!` 
        }))
      }
    } catch (error) {
      dispatch(completeCategoryValidation(category))
      dispatch(addNotification({ 
        type: 'error', 
        message: 'Scanning failed' 
      }))
    }
  }

  // Handle individual stream validation
  const handleSingleStreamValidation = async (streamUrl) => {
    try {
      const result = await dispatch(validateStream(streamUrl)).unwrap()
      const message = result.preloaded 
        ? 'Stream validated and pre-loaded for instant playback!' 
        : 'Stream validation completed'
      dispatch(addNotification({ 
        type: 'success', 
        message 
      }))
    } catch (error) {
      dispatch(addNotification({ 
        type: 'error', 
        message: 'Stream validation failed' 
      }))
    }
  }

  // Handle play stream - open player directly without validation
  const handlePlayStream = (stream) => {
    const isPreloaded = streamPreloaded[stream.url]
    if (isPreloaded) {
      dispatch(addNotification({ 
        type: 'success', 
        message: 'Stream is pre-loaded - instant playback!' 
      }))
    } else {
      dispatch(addNotification({ 
        type: 'info', 
        message: 'Opening stream in video player - testing playback...' 
      }))
    }
    dispatch(openPlayer(stream))
  }

  // Handle category viewer
  const handleOpenCategoryViewer = (category, streams) => {
    dispatch(openCategoryViewer({ name: category, streams }))
  }

  // Handle download
  const handleDownload = (streams, categoryName) => {
    downloadM3U(streams, categoryName)
    dispatch(addNotification({ 
      type: 'success', 
      message: `Downloaded ${categoryName} streams` 
    }))
  }

  // Handle cancel scanning
  const handleCancelScanning = () => {
    dispatch(completeCategoryValidation(currentScanningCategory))
    dispatch(addNotification({ 
      type: 'warning', 
      message: 'Scanning cancelled' 
    }))
  }

  // Clear notifications after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(clearError())
      dispatch(clearSuccess())
    }, 5000)
    return () => clearTimeout(timer)
  }, [error, success, dispatch])

  return (
    <div className="app">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-overlay"
          >
            <LoadingSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      <Header />
      
      <main className="main-content">
        <CrawlerForm 
          url={url}
          filter={filter}
          loading={loading}
          validationMode={validationMode}
          scanMode={scanMode}
          onUrlChange={(value) => dispatch(setUrl(value))}
          onFilterChange={(value) => dispatch(setFilter(value))}
          onValidationModeChange={handleValidationModeChange}
          onScanModeChange={handleScanModeChange}
          onCrawl={handleCrawl}
        />
        
        <AnimatePresence>
          {loading && <LoadingSkeleton />}
          
          {!loading && categorizedStreams && Object.keys(categorizedStreams).length > 0 && (
            <ResultsContainer
              categorizedStreams={categorizedStreams}
              streamStatus={streamStatus}
              streamPreloaded={streamPreloaded}
              scanMode={scanMode}
              onCategoryValidation={handleCategoryValidation}
              onSingleStreamValidation={handleSingleStreamValidation}
              onPlayStream={handlePlayStream}
              onOpenCategoryViewer={handleOpenCategoryViewer}
              onDownload={handleDownload}
              selectedFilter={selectedFilter}
              onFilterChange={(filter) => dispatch(setSelectedFilter(filter))}
              filterStreamsByStatus={filterStreamsByStatus}
            />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showPlayer && currentStream && (
          <VideoPlayer 
            stream={currentStream}
            onClose={() => dispatch(closePlayer())}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCategoryViewer && selectedCategory && (
          <CategoryViewer
            category={selectedCategory}
            streams={selectedCategory.streams}
            streamStatus={streamStatus}
            streamPreloaded={streamPreloaded}
            scanMode={scanMode}
            onClose={() => dispatch(closeCategoryViewer())}
            onPlayStream={handlePlayStream}
            onSingleStreamValidation={handleSingleStreamValidation}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>

      <ScanningProgress
        isScanning={validatingStreams}
        categoryName={currentScanningCategory}
        progress={validationProgress}
        totalStreams={totalToValidate}
        validatedCount={validatedCount}
        scanMode={scanMode}
        onCancel={handleCancelScanning}
      />

      <NotificationContainer />
    </div>
  )
}

export default App
