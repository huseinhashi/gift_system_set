//src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  UserCog,
  Phone,
  MapPin,
  Clock,
  Shield,
  RefreshCw,
  CheckSquare,
  Calendar,
  User,
  AlertTriangle,
  Activity,
  PieChart,
  BarChart,
  Wifi,
  WifiOff
} from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    admins: 0,
    customers: 0,
    employees: 0,
    deliveries: 0,
    orders: 0,
    payments: 0,
    products: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [adminsRes, customersRes, employeesRes, deliveriesRes, ordersRes, paymentsRes, productsRes] = await Promise.all([
        api.get("/admins"),
        api.get("/customers"),
        api.get("/employees"),
        api.get("/deliveries"),
        api.get("/orders"),
        api.get("/payments"),
        api.get("/products"),
      ]);
      setStats({
        admins: adminsRes.data.data?.length || 0,
        customers: customersRes.data.data?.length || 0,
        employees: employeesRes.data.data?.length || 0,
        deliveries: deliveriesRes.data?.length || 0,
        orders: ordersRes.data?.length || 0,
        payments: paymentsRes.data?.length || 0,
        products: productsRes.data.data?.length || 0,
      });
      setIsLoading(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
      });
      setIsLoading(false);
    }
  };

  const statCards = [
    { title: "Admins", value: stats.admins, icon: UserCog, description: "System administrators" },
    { title: "Customers", value: stats.customers, icon: User, description: "Registered customers" },
    { title: "Employees", value: stats.employees, icon: Shield, description: "Delivery employees" },
    { title: "Deliveries", value: stats.deliveries, icon: MapPin, description: "Total deliveries" },
    { title: "Orders", value: stats.orders, icon: Calendar, description: "Total orders" },
    { title: "Payments", value: stats.payments, icon: BarChart, description: "Total payments" },
    { title: "Products", value: stats.products, icon: PieChart, description: "Total products" },
  ];

  const navCards = [
    { title: "Admins", description: "Manage system admins", icon: UserCog, link: "/users/admins", color: "bg-blue-500/10", iconColor: "text-blue-500" },
    { title: "Customers", description: "View and manage customers", icon: User, link: "/users/customers", color: "bg-green-500/10", iconColor: "text-green-500" },
    { title: "Employees", description: "Manage delivery employees", icon: Shield, link: "/users/employees", color: "bg-purple-500/10", iconColor: "text-purple-500" },
    { title: "Deliveries", description: "View and manage deliveries", icon: MapPin, link: "/deliveries", color: "bg-orange-500/10", iconColor: "text-orange-500" },
    { title: "Orders", description: "View and manage orders", icon: Calendar, link: "/orders", color: "bg-amber-500/10", iconColor: "text-amber-500" },
    { title: "Payments", description: "View and manage payments", icon: BarChart, link: "/payments", color: "bg-pink-500/10", iconColor: "text-pink-500" },
    { title: "Products", description: "View and manage products", icon: PieChart, link: "/products", color: "bg-teal-500/10", iconColor: "text-teal-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <Button onClick={fetchDashboardData} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </>
          )}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={`p-3 rounded-full ${card.iconColor} ${card.color}`}><card.icon className="h-6 w-6" /></div>
              <div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "-" : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {navCards.map((card) => (
          <Link to={card.link} key={card.title}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-full ${card.iconColor} ${card.color}`}><card.icon className="h-6 w-6" /></div>
                <div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}; 