import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// Backend API URL
const API_BASE_URL = 'http://localhost:5000'

// Pre-load stream data for instant playback
const preloadStream = async (streamUrl) => {
  try {
    // Create a temporary video element to pre-load the stream
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'
    video.muted = true // Mute to avoid audio issues
    
    // Set the video source using proxy
    const proxyUrl = `http://localhost:5000/proxy-video?url=${encodeURIComponent(streamUrl)}`
    video.src = proxyUrl
    
    // Wait for metadata to load
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve
      video.onerror = reject
      // Timeout after 15 seconds
      setTimeout(reject, 15000)
    })
    
    // Clean up
    video.remove()
    return { url: streamUrl, preloaded: true }
  } catch (error) {
    console.warn('Pre-load failed for:', streamUrl, error.message)
    return { url: streamUrl, preloaded: false }
  }
}

// Quick validation - just check if stream is accessible
const performQuickValidation = async (streamUrl) => {
  try {
    const response = await axios.head(streamUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      validateStatus: (status) => status < 500
    })
    
    const contentType = response.headers['content-type'] || ''
    const contentLength = response.headers['content-length'] || '0'
    
    // Quick check for valid stream
    const isWorking = (
      contentType.includes('video/') ||
      contentType.includes('audio/') ||
      contentType.includes('application/') ||
      contentType.includes('text/') ||
      parseInt(contentLength) > 50 ||
      streamUrl.includes('.m3u8') ||
      streamUrl.includes('.m3u') ||
      streamUrl.includes('.mp4') ||
      streamUrl.includes('.ts') ||
      streamUrl.includes('.mpd') ||
      response.status === 200 ||
      response.status === 206
    )
    
    return {
      url: streamUrl,
      status: isWorking ? 'working' : 'broken',
      preloaded: false // Quick scan doesn't pre-load
    }
  } catch (error) {
    return {
      url: streamUrl,
      status: 'broken',
      preloaded: false
    }
  }
}

// Async thunk for quick validation (fast scan)
export const quickValidateStream = createAsyncThunk(
  'validation/quickValidateStream',
  async (streamUrl, { rejectWithValue }) => {
    try {
      return await performQuickValidation(streamUrl)
    } catch (error) {
      return {
        url: streamUrl,
        status: 'broken',
        preloaded: false
      }
    }
  }
)

// Async thunk for validating a single stream with pre-loading
export const validateStream = createAsyncThunk(
  'validation/validateStream',
  async (streamUrl, { rejectWithValue }) => {
    try {
      // Use backend API for validation
      const response = await axios.post(`${API_BASE_URL}/validate-stream`, {
        url: streamUrl
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data.success) {
        // Pre-load the stream for instant playback
        const preloadResult = await preloadStream(streamUrl)
        
        return {
          url: streamUrl,
          status: response.data.status,
          content_type: response.data.content_type,
          response_time: response.data.response_time,
          preloaded: preloadResult.preloaded
        }
      } else {
        return {
          url: streamUrl,
          status: 'broken',
          preloaded: false
        }
      }
      
    } catch (error) {
      // Fallback to frontend validation if backend is unavailable
      console.warn('Backend validation failed, using frontend fallback:', error.message)
      
      try {
        // Quick validation first
        const quickResult = await performQuickValidation(streamUrl)
        
        if (quickResult.status === 'working') {
          // If working, try to pre-load
          const preloadResult = await preloadStream(streamUrl)
          return {
            url: streamUrl,
            status: 'working',
            preloaded: preloadResult.preloaded
          }
        } else {
          return quickResult
        }
        
      } catch (getError) {
        return {
          url: streamUrl,
          status: 'broken',
          preloaded: false
        }
      }
    }
  }
)

// Async thunk for quick batch validation (fast scan)
export const quickValidateStreams = createAsyncThunk(
  'validation/quickValidateStreams',
  async (streams, { dispatch, rejectWithValue }) => {
    const batchSize = 5 // Larger batch for quick scan
    const results = {}
    
    for (let i = 0; i < streams.length; i += batchSize) {
      const batch = streams.slice(i, i + batchSize)
      
      // Validate batch in parallel
      const batchPromises = batch.map(stream => 
        performQuickValidation(stream.url)
      )
      
      const batchResults = await Promise.all(batchPromises)
      
      // Update results
      batchResults.forEach(result => {
        results[result.url] = result.status
      })
      
      // Short delay between batches
      if (i + batchSize < streams.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return results
  }
)

// Async thunk for validating multiple streams with pre-loading
export const validateStreams = createAsyncThunk(
  'validation/validateStreams',
  async (streams, { dispatch, rejectWithValue }) => {
    try {
      // Use backend API for batch validation
      const urls = streams.map(stream => stream.url)
      
      const response = await axios.post(`${API_BASE_URL}/validate-streams`, {
        urls: urls
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data.success) {
        // Pre-load all working streams
        const results = response.data.results
        const preloadPromises = Object.entries(results)
          .filter(([url, status]) => status === 'working')
          .map(async ([url, status]) => {
            const preloadResult = await preloadStream(url)
            return { url, status, preloaded: preloadResult.preloaded }
          })
        
        const preloadResults = await Promise.all(preloadPromises)
        
        // Combine validation and preload results
        const finalResults = {}
        Object.entries(results).forEach(([url, status]) => {
          const preloadResult = preloadResults.find(r => r.url === url)
          finalResults[url] = status
          if (preloadResult) {
            finalResults[`${url}_preloaded`] = preloadResult.preloaded
          }
        })
        
        return finalResults
      } else {
        throw new Error('Backend validation failed')
      }
      
    } catch (error) {
      // Fallback to individual validation if backend is unavailable
      console.warn('Backend batch validation failed, using individual validation:', error.message)
      
      const batchSize = 3 // Smaller batch for more accurate validation
      const results = {}
      
      for (let i = 0; i < streams.length; i += batchSize) {
        const batch = streams.slice(i, i + batchSize)
        
        // Validate batch in parallel
        const batchPromises = batch.map(stream => 
          dispatch(validateStream(stream.url)).unwrap()
        )
        
        const batchResults = await Promise.all(batchPromises)
        
        // Update results
        batchResults.forEach(result => {
          results[result.url] = result.status
          if (result.preloaded !== undefined) {
            results[`${result.url}_preloaded`] = result.preloaded
          }
        })
        
        // Delay between batches to avoid overwhelming servers
        if (i + batchSize < streams.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      return results
    }
  }
)

const initialState = {
  streamStatus: {}, // {streamUrl: 'working' | 'broken' | 'checking'}
  streamPreloaded: {}, // {streamUrl: true/false} - tracks pre-loaded streams
  validatingStreams: false,
  validationProgress: 0,
  totalToValidate: 0,
  validatedCount: 0,
  categoryValidationStatus: {}, // {categoryName: 'validating' | 'completed' | 'idle'}
  validationMode: 'lenient', // 'strict' | 'lenient' | 'disabled'
  currentScanningCategory: '', // Name of category being scanned
  scanMode: 'quick', // 'quick' | 'preload' - scan mode
}

const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    setStreamStatus: (state, action) => {
      const { url, status } = action.payload
      state.streamStatus[url] = status
    },
    setStreamPreloaded: (state, action) => {
      const { url, preloaded } = action.payload
      state.streamPreloaded[url] = preloaded
    },
    clearStreamStatus: (state, action) => {
      const url = action.payload
      delete state.streamStatus[url]
      delete state.streamPreloaded[url]
    },
    clearAllStreamStatus: (state) => {
      state.streamStatus = {}
      state.streamPreloaded = {}
    },
    setValidatingStreams: (state, action) => {
      state.validatingStreams = action.payload
    },
    setValidationProgress: (state, action) => {
      state.validationProgress = action.payload
    },
    setCategoryValidationStatus: (state, action) => {
      const { category, status } = action.payload
      state.categoryValidationStatus[category] = status
    },
    startCategoryValidation: (state, action) => {
      const { category, totalStreams, scanMode } = action.payload
      state.categoryValidationStatus[category] = 'validating'
      state.currentScanningCategory = category
      state.scanMode = scanMode || 'quick'
      state.totalToValidate = totalStreams
      state.validatedCount = 0
      state.validationProgress = 0
    },
    updateValidationProgress: (state, action) => {
      state.validatedCount = action.payload
      state.validationProgress = (state.validatedCount / state.totalToValidate) * 100
    },
    completeCategoryValidation: (state, action) => {
      const category = action.payload
      state.categoryValidationStatus[category] = 'completed'
      state.validatingStreams = false
      state.currentScanningCategory = ''
    },
    setValidationMode: (state, action) => {
      state.validationMode = action.payload
    },
    setScanMode: (state, action) => {
      state.scanMode = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Quick validation
      .addCase(quickValidateStream.pending, (state, action) => {
        const url = action.meta.arg
        state.streamStatus[url] = 'checking'
      })
      .addCase(quickValidateStream.fulfilled, (state, action) => {
        const { url, status } = action.payload
        state.streamStatus[url] = status
        state.validatedCount += 1
        state.validationProgress = (state.validatedCount / state.totalToValidate) * 100
      })
      .addCase(quickValidateStream.rejected, (state, action) => {
        const url = action.meta.arg
        state.streamStatus[url] = 'broken'
        state.validatedCount += 1
        state.validationProgress = (state.validatedCount / state.totalToValidate) * 100
      })
      
      // Pre-load validation
      .addCase(validateStream.pending, (state, action) => {
        const url = action.meta.arg
        state.streamStatus[url] = 'checking'
      })
      .addCase(validateStream.fulfilled, (state, action) => {
        const { url, status, preloaded } = action.payload
        
        // Apply validation mode
        let finalStatus = status
        if (state.validationMode === 'disabled') {
          finalStatus = 'working' // Assume all streams work when validation is disabled
        } else if (state.validationMode === 'lenient' && status === 'broken') {
          // In lenient mode, only mark as broken if it's clearly broken
          finalStatus = status
        }
        
        state.streamStatus[url] = finalStatus
        if (preloaded !== undefined) {
          state.streamPreloaded[url] = preloaded
        }
        state.validatedCount += 1
        state.validationProgress = (state.validatedCount / state.totalToValidate) * 100
      })
      .addCase(validateStream.rejected, (state, action) => {
        const url = action.meta.arg
        
        // In lenient mode, don't mark as broken on network errors
        if (state.validationMode === 'lenient') {
          state.streamStatus[url] = 'working'
        } else {
          state.streamStatus[url] = 'broken'
        }
        
        state.validatedCount += 1
        state.validationProgress = (state.validatedCount / state.totalToValidate) * 100
      })
      
      // Quick batch validation
      .addCase(quickValidateStreams.pending, (state) => {
        state.validatingStreams = true
      })
      .addCase(quickValidateStreams.fulfilled, (state, action) => {
        state.streamStatus = { ...state.streamStatus, ...action.payload }
        state.validatingStreams = false
      })
      .addCase(quickValidateStreams.rejected, (state) => {
        state.validatingStreams = false
      })
      
      // Pre-load batch validation
      .addCase(validateStreams.pending, (state) => {
        state.validatingStreams = true
      })
      .addCase(validateStreams.fulfilled, (state, action) => {
        // Apply validation mode to batch results
        const results = action.payload
        const processedResults = {}
        
        Object.entries(results).forEach(([key, value]) => {
          if (key.endsWith('_preloaded')) {
            // Handle preload status
            const url = key.replace('_preloaded', '')
            state.streamPreloaded[url] = value
          } else {
            // Handle validation status
            let finalStatus = value
            if (state.validationMode === 'disabled') {
              finalStatus = 'working'
            } else if (state.validationMode === 'lenient' && value === 'broken') {
              // Could add more lenient logic here
              finalStatus = value
            }
            processedResults[key] = finalStatus
          }
        })
        
        state.streamStatus = { ...state.streamStatus, ...processedResults }
        state.validatingStreams = false
      })
      .addCase(validateStreams.rejected, (state) => {
        state.validatingStreams = false
      })
  },
})

export const {
  setStreamStatus,
  setStreamPreloaded,
  clearStreamStatus,
  clearAllStreamStatus,
  setValidatingStreams,
  setValidationProgress,
  setCategoryValidationStatus,
  startCategoryValidation,
  updateValidationProgress,
  completeCategoryValidation,
  setValidationMode,
  setScanMode,
} = validationSlice.actions

export default validationSlice.reducer 