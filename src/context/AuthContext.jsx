/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearSession,
  getCurrentUser,
  getSessionToken,
  getStoredUser,
  loginUser,
  logoutUser,
  registerUser,
} from "@/src/utils/backendApi.utils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getSessionToken());
  const [loading, setLoading] = useState(Boolean(getSessionToken()));

  useEffect(() => {
    let mounted = true;
    const tokenValue = getSessionToken();
    if (!tokenValue) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((currentUser) => {
        if (!mounted) return;
        setUser(currentUser);
        setToken(tokenValue);
      })
      .catch(() => {
        clearSession();
        if (!mounted) return;
        setUser(null);
        setToken(null);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      async login(payload) {
        const data = await loginUser(payload);
        setUser(data.user);
        setToken(data.token);
        return data;
      },
      async register(payload) {
        const data = await registerUser(payload);
        setUser(data.user);
        setToken(data.token);
        return data;
      },
      async logout() {
        await logoutUser();
        setUser(null);
        setToken(null);
      },
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
