import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '@/api'
import type { User, UserSettings } from '@/types'

type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'guest'

interface AuthState {
  user: User | null
  status: AuthStatus
}

const initialState: AuthState = { user: null, status: 'idle' }

/** Uygulama açılınca mevcut oturumu kontrol eder (kayıtlı token hâlâ geçerli mi?). */
export const fetchMe = createAsyncThunk('auth/me', () => api.me())

export const login = createAsyncThunk(
  'auth/login',
  ({ email, password }: { email: string; password: string }) => api.login(email, password),
)

export const logout = createAsyncThunk('auth/logout', () => api.logout())

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  (patch: Partial<Pick<User, 'name' | 'email'>>) => api.updateProfile(patch),
)

export const updateSettings = createAsyncThunk(
  'auth/updateSettings',
  (patch: Partial<UserSettings>) => api.updateSettings(patch),
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** 401 interceptor'ı tarafından çağrılır. */
    sessionExpired(state) {
      state.user = null
      state.status = 'guest'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'checking'
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'authenticated'
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null
        state.status = 'guest'
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'authenticated'
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.status = 'guest'
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.user = action.payload
      })
  },
})

export const { sessionExpired } = authSlice.actions
export default authSlice.reducer
