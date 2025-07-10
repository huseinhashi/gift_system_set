import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axios";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("jwt_token");
  });

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwt_token");
    if (jwtToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
    }
  }, []);

  // Login with email for admin/staff
  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/admin/login", { 
        email,
        password,
      });
      const { data } = response.data;
      localStorage.setItem("jwt_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.admin));
      setUser(data.admin);
      setIsAuthenticated(true);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      return data.admin;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};