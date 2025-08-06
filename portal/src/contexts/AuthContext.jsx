import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("authToken");
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [currentWallet, setCurrentWallet] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.wallet_address) {
          setCurrentWallet(userData.wallet_address);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      const newWallet = accounts[0];
      if (isAuthenticated && currentWallet && newWallet !== currentWallet) {
        console.log("MetaMask account changed:", newWallet);
        logout();
      }
    };
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [isAuthenticated, currentWallet]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      
      const walletAddress = accounts[0];
      setCurrentWallet(walletAddress);
      return walletAddress;
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const loginWithWallet = async () => {
    try {
      const walletAddress = await connectWallet();
      
      const response = await api.post("/auth/admin/login", { wallet_address: walletAddress });
      const { data } = response.data;
      
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.admin));

      setUser(data.admin);
      setCurrentWallet(walletAddress);
      setIsAuthenticated(true);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      navigate("/admin/dashboard");
      return data.admin;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const response = await api.post("/auth/doctor/login", { email, password });
      const { data } = response.data;
      
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.doctor));

      setUser(data.doctor);
      setIsAuthenticated(true);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      navigate("/doctor");
      return data.doctor;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setCurrentWallet(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common["Authorization"];
    navigate("/");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isConnecting,
        currentWallet,
        loginWithWallet,
        loginWithEmail,
        connectWallet,
        logout 
      }}
    >
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