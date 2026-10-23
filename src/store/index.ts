import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { setUnauthorizedHandler } from '@/api/client'
import authReducer, { sessionExpired } from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

setUnauthorizedHandler(() => store.dispatch(sessionExpired()))

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
