import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  showPlayer: false,
  currentStream: null,
  isMuted: false,
  isFullscreen: false,
  volume: 1,
  playbackRate: 1,
  quality: 'auto',
  showControls: true,
  buffering: false,
  error: null,
}

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    openPlayer: (state, action) => {
      state.showPlayer = true
      state.currentStream = action.payload
      state.error = null
    },
    closePlayer: (state) => {
      state.showPlayer = false
      state.currentStream = null
      state.error = null
    },
    setMuted: (state, action) => {
      state.isMuted = action.payload
    },
    setVolume: (state, action) => {
      state.volume = action.payload
    },
    setPlaybackRate: (state, action) => {
      state.playbackRate = action.payload
    },
    setQuality: (state, action) => {
      state.quality = action.payload
    },
    setFullscreen: (state, action) => {
      state.isFullscreen = action.payload
    },
    setShowControls: (state, action) => {
      state.showControls = action.payload
    },
    setBuffering: (state, action) => {
      state.buffering = action.payload
    },
    setPlayerError: (state, action) => {
      state.error = action.payload
    },
    clearPlayerError: (state) => {
      state.error = null
    },
  },
})

export const {
  openPlayer,
  closePlayer,
  setMuted,
  setVolume,
  setPlaybackRate,
  setQuality,
  setFullscreen,
  setShowControls,
  setBuffering,
  setPlayerError,
  clearPlayerError,
} = playerSlice.actions

export default playerSlice.reducer 