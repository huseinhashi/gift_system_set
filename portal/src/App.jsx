// App.jsx - Updated with consolidated login system
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ProtectedRoute, PublicRoute } from "@/components/Authpages";
import { Layout } from "@/components/layout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminsPage } from "@/pages/admin/AdminsPage";
import { EmployeesPage } from "@/pages/admin/EmployeesPage";
import { CustomersPage } from "@/pages/admin/CustomersPage";
import { ProductsPage } from "@/pages/admin/ProductsPage";
import { OrdersPage } from "@/pages/admin/OrdersPage";
import { OrderDetailsPage } from "@/pages/admin/OrderDetailsPage";
import { PaymentsPage } from "@/pages/admin/PaymentsPage";
import { DeliveriesPage } from "@/pages/admin/DeliveriesPage";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
      <BrowserRouter>
        <AuthProvider>
            <Routes>
          {/* Login is now home */}
              <Route
            path="/"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
          {/* Admin Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* User Management */}
          <Route
            path="/users/admins"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <AdminsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/employees"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <EmployeesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
              <Route
            path="/users/customers"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <CustomersPage />
                </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout>
                  <ProductsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout>
                  <OrdersPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout>
                  <OrderDetailsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout>
                  <PaymentsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliveries"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout>
                  <DeliveriesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Fallback: redirect all unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
        </AuthProvider>
      </BrowserRouter>
  );
}

export default App;