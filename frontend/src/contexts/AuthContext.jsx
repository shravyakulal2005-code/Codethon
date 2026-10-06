import { createContext, useContext, useState, useCallback } from "react";
import { authApi, userApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem("access_token", res.data.access_token);
    const meRes = await userApi.getMe();
    setUser(meRes.data);
    return meRes.data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    localStorage.setItem("access_token", res.data.access_token);
    const meRes = await userApi.getMe();
    setUser(meRes.data);
    return meRes.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    if (!localStorage.getItem("access_token")) return null;
    setLoading(true);
    try {
      const res = await userApi.getMe();
      setUser(res.data);
      return res.data;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
