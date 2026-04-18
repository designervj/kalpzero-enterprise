import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Type for the authenticated user object
export interface AuthUser {
  id?: string;
  name?:string;
  email?: string;
  roles?: string;
  tenant_id?:string;
  tenant_slug?: string;
  access_token?: string;
  expires_at?: string;
  

}

// Shape of auth state
export interface AuthState {
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  isError: boolean;
}

const initialState: AuthState = {
  authUser: null,
  isAuthenticated: false,
  isError: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Called on successful login — sets the user and marks as authenticated
    setAuthUser(state, action: PayloadAction<AuthUser>) {
      state.authUser = action.payload;
      state.isAuthenticated = true;
      state.isError = false;
    },
    // Called when login fails — clears user and flags error
    setAuthError(state) {
      state.authUser = null;
      state.isAuthenticated = false;
      state.isError = true;
    },
    // Called on logout — resets all state
    clearAuth(state) {
      state.authUser = null;
      state.isAuthenticated = false;
      state.isError = false;
    },
  },
});

export const { setAuthUser, setAuthError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
