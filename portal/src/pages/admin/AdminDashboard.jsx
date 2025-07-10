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
  WifiOff,
  CreditCard,
  Truck
} from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useApiRequest } from "@/hooks/useApiRequest";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { request, isLoading } = useApiRequest();
  // Stats state
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, paymentsRes, deliveriesRes, productsRes, adminsRes, customersRes, employeesRes] = await Promise.all([
        request({ method: "get", url: "/orders" }),
        request({ method: "get", url: "/payments" }),
        request({ method: "get", url: "/deliveries" }),
        request({ method: "get", url: "/products" }),
        request({ method: "get", url: "/admins" }),
        request({ method: "get", url: "/customers" }),
        request({ method: "get", url: "/employees" }),
      ]);
      setOrders(ordersRes.data || []);
      setPayments(paymentsRes.data || []);
      setDeliveries(deliveriesRes.data || []);
      setProducts(productsRes.data || []);
      setAdmins(adminsRes.data || []);
      setCustomers(customersRes.data || []);
      setEmployees(employeesRes.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Orders stats ---
  const totalOrders = orders.length;
  const totalOrderAmount = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;
  const confirmedOrders = orders.filter(o => o.status === "confirmed").length;

  // --- Payments stats ---
  const totalPayments = payments.length;
  const totalPaymentAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const cashPayments = payments.filter(p => p.payment_type === "cash").length;
  const apiPayments = payments.filter(p => p.payment_type === "api").length;

  // --- Deliveries stats ---
  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter(d => d.delivery_status === "pending").length;
  const inTransitDeliveries = deliveries.filter(d => d.delivery_status === "in_transit").length;
  const deliveredDeliveries = deliveries.filter(d => d.delivery_status === "delivered").length;
  const failedDeliveries = deliveries.filter(d => d.delivery_status === "failed").length;

  // --- Products stats ---
  const totalProducts = products.length;

  // --- Users stats ---
  const totalAdmins = admins.length;
  const totalCustomers = customers.length;
  const totalEmployees = employees.length;
  console.log(totalAdmins, totalCustomers, totalEmployees);

  // --- Card definitions ---
  const adminCards = [
    { title: "Admins", value: totalAdmins, icon: UserCog, description: "System administrators" },
    { title: "Customers", value: totalCustomers, icon: User, description: "Registered customers" },
    { title: "Employees", value: totalEmployees, icon: Shield, description: "Delivery employees" },
  ];
  const productCards = [
    { title: "Products", value: totalProducts, icon: PieChart, description: "Total products" },
  ];
  const orderCards = [
    { title: "Orders", value: totalOrders, icon: Calendar, description: "Total orders" },
    { title: "Pending Orders", value: pendingOrders, icon: Clock, description: "Pending orders" },
    { title: "Delivered Orders", value: deliveredOrders, icon: CheckSquare, description: "Delivered orders" },
    { title: "Confirmed Orders", value: confirmedOrders, icon: Activity, description: "Confirmed orders" },
    { title: "Order Revenue", value: `$${totalOrderAmount.toFixed(2)}`, icon: BarChart, description: "Total order revenue" },
  ];
  const paymentCards = [
    { title: "Payments", value: totalPayments, icon: CreditCard, description: "Total payments" },
    { title: "Cash Payments", value: cashPayments, icon: CreditCard, description: "Cash payments" },
    { title: "API Payments", value: apiPayments, icon: CreditCard, description: "API payments" },
    { title: "Payment Revenue", value: `$${totalPaymentAmount.toFixed(2)}`, icon: BarChart, description: "Total payment revenue" },
  ];
  const deliveryCards = [
    { title: "Deliveries", value: totalDeliveries, icon: Truck, description: "Total deliveries" },
    { title: "Pending Deliveries", value: pendingDeliveries, icon: Truck, description: "Pending deliveries" },
    { title: "In Transit", value: inTransitDeliveries, icon: Truck, description: "In transit" },
    { title: "Delivered", value: deliveredDeliveries, icon: Truck, description: "Delivered" },
    { title: "Failed", value: failedDeliveries, icon: Truck, description: "Failed deliveries" },
  ];

  // --- Navigation cards ---
  const navCards = [
    ...(user?.role === "admin" ? [
      { title: "Admins", description: "Manage system admins", icon: UserCog, link: "/users/admins", color: "bg-blue-500/10", iconColor: "text-blue-500" },
      { title: "Customers", description: "View and manage customers", icon: User, link: "/users/customers", color: "bg-green-500/10", iconColor: "text-green-500" },
      { title: "Employees", description: "Manage delivery employees", icon: Shield, link: "/users/employees", color: "bg-purple-500/10", iconColor: "text-purple-500" },
    ] : []),
    { title: "Deliveries", description: "View and manage deliveries", icon: MapPin, link: "/deliveries", color: "bg-orange-500/10", iconColor: "text-orange-500" },
    { title: "Orders", description: "View and manage orders", icon: Calendar, link: "/orders", color: "bg-amber-500/10", iconColor: "text-amber-500" },
    { title: "Payments", description: "View and manage payments", icon: BarChart, link: "/payments", color: "bg-pink-500/10", iconColor: "text-pink-500" },
    { title: "Products", description: "View and manage products", icon: PieChart, link: "/products", color: "bg-teal-500/10", iconColor: "text-teal-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button onClick={fetchDashboardData} disabled={loading}>
          {loading ? (
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
      {/* Admin/user stats */}
      {user?.role === "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adminCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10"><card.icon className="h-6 w-6" /></div>
                <div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "-" : card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Orders stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {orderCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10"><card.icon className="h-6 w-6 text-amber-500" /></div>
              <div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Payments stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {paymentCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-pink-500/10"><card.icon className="h-6 w-6 text-pink-500" /></div>
              <div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Deliveries stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {deliveryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10"><card.icon className="h-6 w-6 text-orange-500" /></div>
              <div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Products stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-teal-500/10"><card.icon className="h-6 w-6 text-teal-500" /></div>
              <div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Navigation cards */}
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