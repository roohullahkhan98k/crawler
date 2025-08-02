import { configureStore } from '@reduxjs/toolkit'
import crawlerReducer from './slices/crawlerSlice'
import playerReducer from './slices/playerSlice'
import validationReducer from './slices/validationSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    crawler: crawlerReducer,
    player: playerReducer,
    validation: validationReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
}) 