import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// Async thunk for crawling
export const crawlStreams = createAsyncThunk(
  'crawler/crawlStreams',
  async ({ url, filter }, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:5000/crawl', {
        url: url.trim(),
        filter: filter.trim() || undefined
      })
      
      if (response.data.success) {
        return response.data
      } else {
        return rejectWithValue(response.data.error || 'Failed to crawl streams')
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 
        'Failed to connect to the server. Make sure the API is running on http://localhost:5000'
      )
    }
  }
)

const initialState = {
  url: '',
  filter: '',
  loading: false,
  error: '',
  success: '',
  results: null,
  categorizedStreams: {},
  totalStreams: 0,
  sourceUrl: '',
}

const crawlerSlice = createSlice({
  name: 'crawler',
  initialState,
  reducers: {
    setUrl: (state, action) => {
      state.url = action.payload
    },
    setFilter: (state, action) => {
      state.filter = action.payload
    },
    clearError: (state) => {
      state.error = ''
    },
    clearSuccess: (state) => {
      state.success = ''
    },
    clearResults: (state) => {
      state.results = null
      state.categorizedStreams = {}
      state.totalStreams = 0
      state.sourceUrl = ''
    },
    setCategorizedStreams: (state, action) => {
      state.categorizedStreams = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(crawlStreams.pending, (state) => {
        state.loading = true
        state.error = ''
        state.success = ''
        state.results = null
      })
      .addCase(crawlStreams.fulfilled, (state, action) => {
        state.loading = false
        state.results = action.payload
        state.totalStreams = action.payload.total_streams
        state.sourceUrl = action.payload.source_url
        state.success = `Successfully extracted ${action.payload.total_streams} streams from ${action.payload.source_url}`
      })
      .addCase(crawlStreams.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { 
  setUrl, 
  setFilter, 
  clearError, 
  clearSuccess, 
  clearResults, 
  setCategorizedStreams 
} = crawlerSlice.actions

export default crawlerSlice.reducer 