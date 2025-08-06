// src/pages/auth/LoginPage.jsx - Admin/Staff Login with MetaMask
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet, AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { loginWithWallet, isConnecting } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleWalletLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await loginWithWallet();
      toast({
        title: "Success",
        description: "Successfully connected with MetaMask",
      });
    } catch (error) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Failed to connect with MetaMask",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallMetaMask = () => {
    window.open("https://metamask.io/download/", "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-100 dark:from-gray-900 dark:to-emerald-950">
      <div className="w-full max-w-md p-8 rounded-xl bg-white dark:bg-card shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Admin/Staff Login</h1>
          <p className="text-sm text-muted-foreground">
            Connect your MetaMask wallet to access the dashboard
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {!window.ethereum ? (
            <div className="text-center space-y-4">
              <Alert>
                <Wallet className="h-4 w-4" />
                <AlertDescription>
                  MetaMask is not installed. Please install MetaMask to continue.
                </AlertDescription>
              </Alert>
              <Button onClick={handleInstallMetaMask} className="w-full">
                Install MetaMask
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleWalletLogin}
              disabled={isLoading || isConnecting}
              className="w-full h-12 text-lg"
            >
              {isLoading || isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Connect with MetaMask
                </div>
              )}
            </Button>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>Only registered wallet addresses can access the admin dashboard.</p>
            <p className="mt-2">
              Make sure you're connected to the correct MetaMask account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};