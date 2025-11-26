// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

type CarRegisterData = {
    name: string;
    licensePlate: string;
    carType: string;
};

export type RegisterParams = {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    car: CarRegisterData;
};

type RegisterPayload = {
    user: {
        firstName: string;
        lastName: string;
        email: string;
        passwordHash: string;
    };
    car: {
        name: string;
        licensePlate: string;
        carType: string;
    };
};

type AuthResponse = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt?: string;
  user?: {
    id: string;
    role: "admin" | "client" | "employee";
  };
};

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  authenticated: boolean | null;
}

export interface AuthProps {
  onRegister: (params: RegisterParams) => Promise<any>;
  onLogin: (email: string, password: string) => Promise<any>;
  onLogout: () => Promise<void>;
  authState: AuthState;
}

const TOKEN_KEY = "jwt_access_token";
const REFRESH_TOKEN_KEY = "jwt_refresh_token";
export const API_URL = "https://pomoyka-backend.onrender.com";

const AuthContext = createContext<AuthProps>({} as AuthProps);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: any) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    refreshToken: null,
    authenticated: null,
  });

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

        if (token && refreshToken) {
          setAuthState({ token, refreshToken, authenticated: true });
        } else {
          setAuthState({ token: null, refreshToken: null, authenticated: false });
        }
      } catch (e) {
        console.error("Failed to load tokens", e);
        setAuthState({ token: null, refreshToken: null, authenticated: false });
      }
    };
    loadTokens();
  }, []);

  useEffect(() => {
    axios.defaults.baseURL = API_URL;
    axios.defaults.timeout = 15000;

    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        if (authState.token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${authState.token}`;
        }
    
        return config;
      },
      (error) => Promise.reject(error)
    );

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = authState.refreshToken;

          if (!refreshToken) {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            setAuthState({ token: null, refreshToken: null, authenticated: false });
            return Promise.reject(error);
          }

          try {
            console.log("[REFRESH] Access token dead — updating...");

            const resp = await axios.post<AuthResponse>(
              `${API_URL}/api/Auth/RefreshToken`,
              { refreshToken }
            );

            const { accessToken, refreshToken: newRefresh } = resp.data;

            if (!accessToken) throw new Error("refreshToken endpoint не вернул токен");

            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
            if (newRefresh) {
              await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefresh);
            }

            setAuthState({
              token: accessToken,
              refreshToken: newRefresh ?? refreshToken,
              authenticated: true,
            });

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          } catch (e) {
            console.error("[REFRESH ERROR]", e);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            setAuthState({ token: null, refreshToken: null, authenticated: false });
            return Promise.reject(e);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [authState.token, authState.refreshToken]);

const registerUser = async (payload: RegisterPayload): Promise<any> => {
  console.log('[registerUser] Payload:', JSON.stringify(payload, null, 2));
  try {
    const resp = await axios.post(`${API_URL}/api/Auth/Register`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });

    console.log('[registerUser] Server response:', resp.status, resp.data);
    return { ok: true, data: resp.data };
  } catch (e: any) {
    if (e.response) {
      console.error('[registerUser] Server error:', e.response.status, e.response.data);
      return { ok: false, error: e.response.data };
    } else {
      console.error('[registerUser] Request error:', e.message);
      return { ok: false, error: { message: e.message } };
    }
  }
};

const register = async (params: RegisterParams): Promise<any> => {
            const payload: RegisterPayload = {
            user: {
                firstName: params.firstName.trim(),
                lastName: params.lastName.trim(),
                email: params.email.trim().toLowerCase(),
                passwordHash: params.passwordHash
            },
            car: {
                name: params.car.name.trim(),
                licensePlate: params.car.licensePlate.trim().toUpperCase(),
                carType: params.car.carType
            }
        };

            try {
            const registrationResult = await registerUser(payload);

            if (registrationResult?.ok) {
                console.log('Registration successful:', registrationResult.data);
                const loginResult = await login(params.email, params.passwordHash);
            if (loginResult && typeof loginResult === 'object' && 'error' in loginResult && loginResult.error) {
                console.error('Login error', loginResult.message);
                return { ok: true, data: registrationResult.data, warning: "Registered successfully but auto-login failed" };
            } else {
            console.log('Logged in successfully after registration:', loginResult);
                return { ok: true, data: loginResult };
            }
            } else {
                console.error('Registration unable', registrationResult?.error);
                return registrationResult;
            }
            } catch (e: any) {
                console.error('Unexpected error:', e);
                return { ok: false, error: { message: e.message || "Unknown error" } };
    }
};

  const login = async (email: string, password: string) => {
    try {
      const result = await axios.post<AuthResponse>(`${API_URL}/api/Auth/login`, { email, password });
      const { accessToken, refreshToken } = result.data;

      if (!accessToken || !refreshToken)
        throw new Error("Сервер не вернул токены");

      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);

      setAuthState({ token: accessToken, refreshToken, authenticated: true });

      return result.data;
    } catch (e: any) {
      if (e.response) {
        console.error("Login error full:", e?.toJSON ? e.toJSON() : e);
        console.error("Login error:", e.response.data);
        return { error: true, message: e.response.data?.message || "Server error" };
      } else {
        console.error("Login error:", e.message);
        return { error: true, message: "Network or setup error" };
      }
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.warn("Logout cleanup error:", e);
    } finally {
      setAuthState({ token: null, refreshToken: null, authenticated: false });
    }
  };

  const value: AuthProps = {
    onRegister: register,
    onLogin: login,
    onLogout: logout,
    authState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
