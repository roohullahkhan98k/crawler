import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  showCategoryViewer: false,
  selectedCategory: null,
  selectedFilter: 'all',
  showDownloadModal: false,
  showSettingsModal: false,
  sidebarOpen: false,
  theme: 'dark',
  animations: true,
  compactMode: false,
  loadingStates: {
    crawling: false,
    validating: false,
    downloading: false,
  },
  notifications: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCategoryViewer: (state, action) => {
      state.showCategoryViewer = true
      state.selectedCategory = action.payload
    },
    closeCategoryViewer: (state) => {
      state.showCategoryViewer = false
      state.selectedCategory = null
    },
    setSelectedFilter: (state, action) => {
      state.selectedFilter = action.payload
    },
    openDownloadModal: (state) => {
      state.showDownloadModal = true
    },
    closeDownloadModal: (state) => {
      state.showDownloadModal = false
    },
    openSettingsModal: (state) => {
      state.showSettingsModal = true
    },
    closeSettingsModal: (state) => {
      state.showSettingsModal = false
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    toggleAnimations: (state) => {
      state.animations = !state.animations
    },
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode
    },
    setLoadingState: (state, action) => {
      const { key, value } = action.payload
      state.loadingStates[key] = value
    },
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        ...action.payload,
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
  },
})

export const {
  openCategoryViewer,
  closeCategoryViewer,
  setSelectedFilter,
  openDownloadModal,
  closeDownloadModal,
  openSettingsModal,
  closeSettingsModal,
  toggleSidebar,
  setTheme,
  toggleAnimations,
  toggleCompactMode,
  setLoadingState,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions

export default uiSlice.reducer 