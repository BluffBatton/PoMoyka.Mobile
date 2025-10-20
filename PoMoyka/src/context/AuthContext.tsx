import React, { createContext, useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as SecureStore from "expo-secure-store";

// Интерфейсы состояния и свойств контекста
type RegisterParams = {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
};

export interface AuthState {
    token: string | null;
    refreshToken: string | null;
    authenticated: boolean | null; // null = loading, true/false = known state
}

export interface AuthProps {
    onRegister: (params: RegisterParams) => Promise<any>;
    onLogin: (email: string, password: string) => Promise<any>;
    onLogout: () => Promise<void>;
    authState: AuthState;
}

const TOKEN_KEY = "jwt_access_token"; // Используем более явные имена
const REFRESH_TOKEN_KEY = "jwt_refresh_token";
export const API_URL = "http://10.0.2.2:5145"; // API_URL без /api

const AuthContext = createContext<AuthProps>({} as AuthProps);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: any) => {
    const [authState, setAuthState] = useState<{ token: string | null; refreshToken: string | null ; authenticated: boolean | null;
    }>({ token: null, refreshToken: null, authenticated: null, }) // null = "Загрузка"

    // --- Interceptor ---
    // Этот interceptor ДОЛЖЕН быть внутри AuthProvider,
    // чтобы он создавался ОДИН РАЗ
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                // Добавляем токен, если он есть в состоянии
                // Это лучше, чем axios.defaults
                if (authState.token) {
                    config.headers.Authorization = `Bearer ${authState.token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                const status = error.response?.status;
                
                // Проверяем, что это 401, не повторный запрос и не эндпоинт рефреша
                if (status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    // 1. Используем refreshToken из состояния
                    const currentRefreshToken = authState.refreshToken;
                    if (!currentRefreshToken) {
                        setAuthState({ token: null, refreshToken: null, authenticated: false });
                        return Promise.reject(error);
                    }

                    try {
                        // 2. TODO: Убедись, что бэкенд имеет этот эндпоинт
                        const refreshResponse = await axios.post(
                            `${API_URL}/api/Auth/refresh`, // Используй свой эндпоинт
                            { refreshToken: currentRefreshToken }
                        );

                        const { accessToken } = refreshResponse.data; // Ожидаем { accessToken: "..." }

                        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
                        
                        // 3. Обновляем состояние
                        setAuthState((prev) => ({
                            ...prev,
                            token: accessToken,
                            authenticated: true,
                        }));
                        
                        // 4. Обновляем заголовок для повторного запроса
                        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
                        return axios(originalRequest);

                    } catch (refreshError) {
                        // Если рефреш не удался, разлогиниваем
                        await SecureStore.deleteItemAsync(TOKEN_KEY);
                        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                        setAuthState({ token: null, refreshToken: null, authenticated: false });
                    }
                }

                return Promise.reject(error);
            }
        );
        
        // Очистка interceptors
        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [authState.token, authState.refreshToken]); // Пере-создаем, если токен изменился

    // --- Загрузка токенов при старте ---
    useEffect(() => {
        const loadToken = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY); // Исправлена опечатка

                if (token && refreshToken) {
                    setAuthState({ token: token, refreshToken: refreshToken, authenticated: true });
                } else {
                    // !! ВАЖНО: Говорим приложению, что мы НЕ авторизованы
                    setAuthState({ token: null, refreshToken: null, authenticated: false });
                }
            } catch (e) {
                console.error("Failed to load tokens", e);
                setAuthState({ token: null, refreshToken: null, authenticated: false });
            }
        };
        loadToken();
    }, []);
    const register = async (params: RegisterParams) => {
        const { first_name, last_name, email, password } = params;
        // TODO: Эта DTO не совпадает с RegisterUserDTO на бэкенде
        // Бэкенд ожидает: { FirstName, LastName, Email, Password, Car? }
        return await axios.post(`${API_URL}/api/Auth/register`, {
             first_name, last_name, email, password
        });
        // (Твоя обработка ошибок здесь была в порядке)
    };

    const login = async (email: string, password: string) => {
        try {
            // Убраны тестовые логи
            const result = await axios.post(`${API_URL}/api/Auth/login`, { email, password });

            // Ожидаем { accessToken: "...", refreshToken: "..." } от бэкенда
            const { accessToken, refreshToken } = result.data;

            if (!accessToken || !refreshToken) {
                throw new Error("Не получены токены от сервера");
            }
            
            // Сохраняем ОБА токена
            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);

            setAuthState({ token: accessToken, refreshToken: refreshToken, authenticated: true });

            return result;
        }
        catch (e: any) {
            console.error("Login error: ", e.response?.data);
            return { error: true, message: (e.response?.data?.message || e.message) };
        }
    };

    const logout = async () => {
        try {
            await GoogleSignin.signOut();
        } catch (e) {
            console.warn('Google signOut error: ', e)
        }
        
        // TODO: Отправь запрос на бэкенд для инвалидации refresh-токена
        // await axios.post(`${API_URL}/api/Auth/logout`, { refreshToken: authState.refreshToken });

        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);

        setAuthState({ token: null, refreshToken: null, authenticated: false })
    };

    const value = {
        onRegister: register,
        onLogin: login,
        onLogout: logout,
        authState
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}