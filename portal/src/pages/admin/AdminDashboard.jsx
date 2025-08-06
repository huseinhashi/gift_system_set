//src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Truck,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Eye,
  Plus
} from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
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
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;

  // --- Payments stats ---
  const totalPayments = payments.length;
  const totalPaymentAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const completedPayments = payments.filter(p => p.status === "completed").length;
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const failedPayments = payments.filter(p => p.status === "failed").length;

  // --- Deliveries stats ---
  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter(d => d.status === "pending").length;
  const inTransitDeliveries = deliveries.filter(d => d.status === "in_transit").length;
  const deliveredDeliveries = deliveries.filter(d => d.status === "delivered").length;
  const failedDeliveries = deliveries.filter(d => d.status === "failed").length;

  // --- Products stats ---
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const lowStockProducts = products.filter(p => p.stock_quantity < 10).length;

  // --- Users stats ---
  const totalAdmins = admins.length;
  const totalCustomers = customers.length;
  const totalEmployees = employees.length;

  // --- Calculate percentages for progress bars ---
  const orderCompletionRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
  const paymentSuccessRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;
  const deliverySuccessRate = totalDeliveries > 0 ? (deliveredDeliveries / totalDeliveries) * 100 : 0;

  // --- Quick Action Cards ---
  const quickActionCards = [
    ...(user?.role === "admin" ? [
      {
        title: "Add Admin",
        description: "Create new admin account",
        icon: UserCog,
        link: "/users/admins",
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
        action: "Add New"
      },
      {
        title: "Add Employee",
        description: "Create new employee account",
        icon: Shield,
        link: "/users/employees",
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-50",
        iconColor: "text-purple-600",
        action: "Add New"
      },
      {
        title: "Add Product",
        description: "Create new product listing",
        icon: Package,
        link: "/products",
        color: "from-emerald-500 to-emerald-600",
        bgColor: "bg-emerald-50",
        iconColor: "text-emerald-600",
        action: "Add New"
      },
    ] : []),
    {
      title: "View Orders",
      description: "Manage all orders",
      icon: ShoppingCart,
      link: "/orders",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      action: "View All"
    },
    {
      title: "View Payments",
      description: "Track payment status",
      icon: CreditCard,
      link: "/payments",
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
      action: "View All"
    },
    {
      title: "View Deliveries",
      description: "Track delivery status",
      icon: Truck,
      link: "/deliveries",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      action: "View All"
    },
  ];

  // --- Stats Cards ---
  const statsCards = [
    ...(user?.role === "admin" ? [
      {
        title: "Total Revenue",
        value: `$${totalPaymentAmount.toFixed(2)}`,
        icon: DollarSign,
        trend: "+12.5%",
        trendUp: true,
        color: "from-emerald-500 to-emerald-600",
        bgColor: "bg-emerald-50",
        iconColor: "text-emerald-600",
        link: "/payments"
      },
      {
        title: "Total Orders",
        value: totalOrders,
        icon: ShoppingCart,
        trend: "+8.2%",
        trendUp: true,
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
        link: "/orders"
      },
      {
        title: "Total Customers",
        value: totalCustomers,
        icon: Users,
        trend: "+15.3%",
        trendUp: true,
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-50",
        iconColor: "text-purple-600",
        link: "/users/customers"
      },
      {
        title: "Total Products",
        value: totalProducts,
        icon: Package,
        trend: "+5.7%",
        trendUp: true,
        color: "from-orange-500 to-orange-600",
        bgColor: "bg-orange-50",
        iconColor: "text-orange-600",
        link: "/products"
      },
    ] : [
      {
        title: "My Deliveries",
        value: totalDeliveries,
        icon: Truck,
        trend: "+3.2%",
        trendUp: true,
        color: "from-indigo-500 to-indigo-600",
        bgColor: "bg-indigo-50",
        iconColor: "text-indigo-600",
        link: "/deliveries"
      },
      {
        title: "Completed Orders",
        value: deliveredOrders,
        icon: CheckSquare,
        trend: "+12.5%",
        trendUp: true,
        color: "from-emerald-500 to-emerald-600",
        bgColor: "bg-emerald-50",
        iconColor: "text-emerald-600",
        link: "/orders"
      },
    ])
  ];

  // --- Status Cards ---
  const statusCards = [
    {
      title: "Order Status",
      items: [
        { label: "Pending", value: pendingOrders, color: "bg-yellow-500" },
        { label: "Confirmed", value: confirmedOrders, color: "bg-blue-500" },
        { label: "Delivered", value: deliveredOrders, color: "bg-emerald-500" },
        { label: "Cancelled", value: cancelledOrders, color: "bg-red-500" },
      ],
      total: totalOrders,
      link: "/orders"
    },
    {
      title: "Payment Status",
      items: [
        { label: "Completed", value: completedPayments, color: "bg-emerald-500" },
        { label: "Pending", value: pendingPayments, color: "bg-yellow-500" },
        { label: "Failed", value: failedPayments, color: "bg-red-500" },
      ],
      total: totalPayments,
      link: "/payments"
    },
    {
      title: "Delivery Status",
      items: [
        { label: "Pending", value: pendingDeliveries, color: "bg-yellow-500" },
        { label: "In Transit", value: inTransitDeliveries, color: "bg-blue-500" },
        { label: "Delivered", value: deliveredDeliveries, color: "bg-emerald-500" },
        { label: "Failed", value: failedDeliveries, color: "bg-red-500" },
      ],
      total: totalDeliveries,
      link: "/deliveries"
    },
    ...(user?.role === "admin" ? [{
      title: "Product Status",
      items: [
        { label: "Active", value: activeProducts, color: "bg-emerald-500" },
        { label: "Low Stock", value: lowStockProducts, color: "bg-red-500" },
      ],
      total: totalProducts,
      link: "/products"
    }] : [])
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's what's happening with your business.
          </p>
        </div>
        <Button onClick={fetchDashboardData} disabled={loading} variant="outline">
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => (
          <Link to={card.link} key={card.title}>
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">{card.trend}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "-" : card.value}</div>
                <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-muted-foreground">View details</span>
                  <ArrowUpRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActionCards.map((card) => (
            <Link to={card.link} key={card.title}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {card.action}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold">{card.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Status Overview */}
              <div>
        <h3 className="text-lg font-semibold mb-4">Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statusCards.map((card) => (
            <Link to={card.link} key={card.title}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription>Total: {card.total}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {card.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                  <Progress 
                    value={card.total > 0 ? (card.items[0]?.value / card.total) * 100 : 0} 
                    className="h-2"
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
              </div>

      {/* Performance Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Order Completion</CardTitle>
              <CardDescription>Success rate of order delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderCompletionRate.toFixed(1)}%</div>
              <Progress value={orderCompletionRate} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {deliveredOrders} of {totalOrders} orders completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Payment Success</CardTitle>
              <CardDescription>Success rate of payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentSuccessRate.toFixed(1)}%</div>
              <Progress value={paymentSuccessRate} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completedPayments} of {totalPayments} payments successful
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Delivery Success</CardTitle>
              <CardDescription>Success rate of deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliverySuccessRate.toFixed(1)}%</div>
              <Progress value={deliverySuccessRate} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {deliveredDeliveries} of {totalDeliveries} deliveries completed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
              <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.slice(0, 5).map((order, index) => (
                <div key={order.order_id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">Order #{order.order_id}</p>
                    <p className="text-sm text-muted-foreground">${order.total_amount}</p>
                  </div>
                  <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.slice(0, 5).map((payment, index) => (
                <div key={payment.payment_id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">Payment #{payment.payment_id}</p>
                    <p className="text-sm text-muted-foreground">${payment.amount}</p>
      </div>
                  <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                    {payment.status}
                  </Badge>
                </div>
              ))}
              {payments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent payments</p>
              )}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}; 