import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { Plus, Eye, Edit, Trash2, Filter, Calendar, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";
import { z } from "zod";

// Zod schema for order validation
const orderSchema = z.object({
  customer_id: z.union([
    z.string()
      .min(1, "Customer is required")
      .refine((val) => !isNaN(Number(val)), "Customer ID must be a valid number"),
    z.number()
      .min(1, "Customer ID must be greater than 0")
  ]),
  status: z.enum(["pending", "confirmed", "delivered", "cancelled", "returned"]).optional(),
  payment_status: z.enum(["pending", "paid", "failed"]).optional(),
});

const orderItemSchema = z.object({
  product_id: z.union([
    z.string()
      .min(1, "Product is required")
      .refine((val) => !isNaN(Number(val)), "Product ID must be a valid number"),
    z.number()
      .min(1, "Product ID must be greater than 0")
  ]),
  quantity: z.union([
    z.string()
      .min(1, "Quantity is required")
      .refine((val) => !isNaN(Number(val)), "Quantity must be a valid number")
      .refine((val) => Number(val) > 0, "Quantity must be greater than 0")
      .refine((val) => Number(val) <= 999999, "Quantity cannot exceed 999,999")
      .refine((val) => Number.isInteger(Number(val)), "Quantity must be a whole number"),
    z.number()
      .min(1, "Quantity must be greater than 0")
      .max(999999, "Quantity cannot exceed 999,999")
      .int("Quantity must be a whole number")
  ]),
});

const orderFormSchema = z.object({
  order: orderSchema,
  items: z.array(orderItemSchema)
    .min(1, "At least one order item is required")
    .max(50, "Cannot add more than 50 items to an order"),
});

export function OrdersPage() {
  const { toast } = useToast();
  const { request, isLoading } = useApiRequest();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({ customer_id: "" });
  const [orderItems, setOrderItems] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  // Fetch data
  const fetchOrders = async () => {
    try {
    const res = await request({ method: "get", url: "/orders" });
    if (res.success) setOrders(res.data);
    } catch (e) {
      toast({ title: "Failed to load orders", variant: "destructive" });
    }
  };
  const fetchCustomers = async () => {
    try {
    const res = await request({ method: "get", url: "/customers" });
    if (res.success) setCustomers(res.data);
    } catch (e) {
      toast({ title: "processing",  });
    }
  };
  const fetchProducts = async () => {
    try {
    const res = await request({ method: "get", url: "/products" });
    if (res.success) setProducts(res.data);
    } catch (e) {
      toast({ title: "Failed to load products", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...orders];

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate, endDate;

      switch (dateFilter) {
        case "today":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "yesterday":
          startDate = startOfDay(subDays(now, 1));
          endDate = endOfDay(subDays(now, 1));
          break;
        case "this_month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case "last_month":
          startDate = startOfMonth(subDays(now, 30));
          endDate = endOfMonth(subDays(now, 30));
          break;
        case "custom":
          if (customDateRange.from && customDateRange.to) {
            startDate = startOfDay(new Date(customDateRange.from));
            endDate = endOfDay(new Date(customDateRange.to));
          }
          break;
        default:
          break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= startDate && orderDate <= endDate;
        });
      }
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply customer filter
    if (customerFilter !== "all") {
      filtered = filtered.filter(order => order.customer_id == customerFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.Order?.Customer?.name?.toLowerCase().includes(term) ||
        order.Order?.Customer?.phone?.includes(term) ||
        order.order_id?.toString().includes(term)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, dateFilter, customDateRange, statusFilter, customerFilter, searchTerm]);

  // Calculate statistics
  const totalOrders = filteredOrders.length;
  const totalAmount = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const pendingOrders = filteredOrders.filter(o => o.status === "pending").length;
  const confirmedOrders = filteredOrders.filter(o => o.status === "confirmed").length;
  const deliveredOrders = filteredOrders.filter(o => o.status === "delivered").length;

  // Order item management
  const handleAddOrderItem = () => {
    setOrderItems((items) => [...items, { product_id: "", quantity: "1" }]);
  };
  const handleRemoveOrderItem = (idx) => {
    setOrderItems((items) => items.filter((_, i) => i !== idx));
  };
  const handleOrderItemChange = (idx, field, value) => {
    setOrderItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };
  const usedProductIds = orderItems.map((item) => item.product_id).filter(Boolean);

  // Price calculations
  const getProductPrice = (product_id) => {
    const p = products.find((p) => String(p.product_id) === String(product_id));
    return p ? Number(p.price) : 0;
  };
  const getProductStock = (product_id) => {
    const p = products.find((p) => String(p.product_id) === String(product_id));
    return p ? Number(p.stock_quantity) : 0;
  };
  const lineTotal = (item) => getProductPrice(item.product_id) * (Number(item.quantity || 0));
  const orderTotal = orderItems.reduce((sum, item) => sum + lineTotal(item), 0);

  // Form handlers
  const handleFormChange = (e) => {
    setOrderForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setOrderForm({ customer_id: "" });
    setOrderItems([]);
    setValidationErrors({});
    setEditingOrder(null);
  };

  // Add order
  const handleAddOrder = () => {
    setAddDialogOpen(true);
    resetForm();
  };

  // Edit order
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setOrderForm({ 
      customer_id: String(order.customer_id || ''),
      status: order.status || "pending",
      payment_status: order.payment_status || "pending"
    });
    setEditDialogOpen(true);
  };

  // Delete order
  const handleDeleteOrder = (order) => {
    setToDelete(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await request({ method: "delete", url: `/orders/${toDelete.order_id}` });
      toast({ title: "Order deleted successfully" });
      fetchOrders();
    } catch (e) {
      toast({ title: "Failed to delete order", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setToDelete(null);
    }
  };

  // Submit order (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      if (editingOrder) {
        // Update order - only status and payment_status
        const updateData = {
          status: orderForm.status,
          payment_status: orderForm.payment_status
        };
        
        // Validate update data
        orderSchema.partial().parse(updateData);
        
        await request({
          method: "put",
          url: `/orders/${editingOrder.order_id}`,
          data: updateData,
        });
        toast({ title: "Order updated successfully" });
        setEditDialogOpen(false);
      } else {
        // Create order - validate full form
        const formData = {
          order: { customer_id: orderForm.customer_id },
          items: orderItems
        };
        
        // Validate with Zod schema
        orderFormSchema.parse(formData);
        
        // Additional stock validation
        for (let i = 0; i < orderItems.length; i++) {
          const item = orderItems[i];
          if (Number(item.quantity || 0) > getProductStock(item.product_id)) {
            setValidationErrors((v) => ({ ...v, [`item_${i}_quantity`]: "Exceeds available stock" }));
            return;
          }
        }
        
        const payload = {
          order: { customer_id: Number(orderForm.customer_id) },
          items: orderItems.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity || 0),
          })),
        };
        
        await request({
          method: "post",
          url: "/orders/bulk",
          data: payload,
        });
        toast({ title: "Order created successfully" });
        setAddDialogOpen(false);
      }
      resetForm();
      fetchOrders();
    } catch (error) {
      // Handle Zod validation errors
      if (error.errors) {
        const errors = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'order') {
            errors[err.path[1]] = err.message;
          } else if (err.path[0] === 'items') {
            const itemIndex = err.path[1];
            const field = err.path[2];
            errors[`item_${itemIndex}_${field}`] = err.message;
          } else {
            errors[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errors);
      } else if (error.response?.data?.message) {
        toast({ 
          title: "Validation Error", 
          description: error.response.data.message,
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to save order", variant: "destructive" });
      }
    }
  };

  // Make phone call
  const makePhoneCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_blank');
    }
  };

  // Helper function to get status requirements
  const getStatusRequirements = (status) => {
    switch (status) {
      case "delivered":
        return "Requires a delivery record with 'delivered' status";
      case "confirmed":
        return "Requires either a delivery record or payment record";
      case "cancelled":
        return "Cannot cancel if already delivered";
      case "returned":
        return "Can only return if previously delivered";
      default:
        return "";
    }
  };

  const getPaymentStatusRequirements = (status) => {
    switch (status) {
      case "paid":
        return "Requires a payment record";
      case "pending":
        return "No payment record should exist";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orders</h2>
        <Button onClick={handleAddOrder}>
          <Plus className="mr-2 h-4 w-4" />Add Order
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Filtered results</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Filtered results</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter orders by date, status, customer, and search terms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <Label>Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Customer</Label>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.customer_id} value={String(customer.customer_id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search by customer, phone, order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDateFilter("all");
                  setStatusFilter("all");
                  setCustomerFilter("all");
                  setSearchTerm("");
                  setCustomDateRange({ from: "", to: "" });
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
          
          {dateFilter === "custom" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={customDateRange.from}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={customDateRange.to}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Showing {filteredOrders.length} of {orders.length} orders</CardDescription>
        </CardHeader>
        <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                {filteredOrders.map((order) => (
              <TableRow key={order.order_id}>
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-normal"
                        onClick={() => navigate(`/orders/${order.order_id}`)}
                      >
                        #{order.order_id}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{order.Customer?.name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{order.Customer?.phone || '-'}</div>
                        </div>
                        {order.Customer?.phone && (
                          <Button size="icon" variant="ghost" onClick={() => makePhoneCall(order.Customer.phone)}>
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${Number(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {order.created_at ? format(new Date(order.created_at), "yyyy-MM-dd HH:mm") : '-'}
                    </TableCell>
                <TableCell className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/orders/${order.order_id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {/* <Button size="icon" variant="ghost" onClick={() => handleEditOrder(order)}>
                        <Edit className="h-4 w-4" />
                      </Button> */}
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteOrder(order)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No orders found matching the current filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Order Dialog */}
      <Dialog open={addDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Edit Order" : "Add Order"}</DialogTitle>
            <DialogDescription>
              {editingOrder ? "Update order status and payment status." : "Create a new order and add items."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {editingOrder ? (
              // Edit mode - only status and payment_status
              <>
                <div>
                  <Label>Status</Label>
                  <Select value={orderForm.status} onValueChange={(v) => setOrderForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.status && <p className="text-sm text-destructive">{validationErrors.status}</p>}
                  {orderForm.status && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getStatusRequirements(orderForm.status)}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Select value={orderForm.payment_status} onValueChange={(v) => setOrderForm((f) => ({ ...f, payment_status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.payment_status && <p className="text-sm text-destructive">{validationErrors.payment_status}</p>}
                  {orderForm.payment_status && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getPaymentStatusRequirements(orderForm.payment_status)}
                    </p>
                  )}
                </div>
              </>
            ) : (
              // Add mode - customer and order items
              <>
            <div>
              <Label>Customer</Label>
              <Select value={orderForm.customer_id} onValueChange={(v) => setOrderForm((f) => ({ ...f, customer_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.customer_id} value={String(c.customer_id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.customer_id && <p className="text-sm text-destructive">{validationErrors.customer_id}</p>}
            </div>
            <div>
              <Label>Order Items</Label>
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Product</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(v) => handleOrderItemChange(idx, "product_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products
                            .filter((p) => !usedProductIds.includes(String(p.product_id)) || String(p.product_id) === String(item.product_id))
                            .map((p) => (
                              <SelectItem key={p.product_id} value={String(p.product_id)}>
                                {p.name} (Stock: {p.stock_quantity})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {validationErrors[`item_${idx}_product_id`] && <p className="text-sm text-destructive">{validationErrors[`item_${idx}_product_id`]}</p>}
                    </div>
                    <div className="w-24">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        max={getProductStock(item.product_id)}
                        value={item.quantity || ""}
                        onChange={(e) => handleOrderItemChange(idx, "quantity", e.target.value)}
                      />
                      {validationErrors[`item_${idx}_quantity`] && <p className="text-sm text-destructive">{validationErrors[`item_${idx}_quantity`]}</p>}
                    </div>
                    <div className="w-28">
                      <Label>Price</Label>
                      <div className="border rounded px-2 py-1 bg-muted">${getProductPrice(item.product_id).toFixed(2)}</div>
                    </div>
                    <div className="w-32">
                      <Label>Line Total</Label>
                      <div className="border rounded px-2 py-1 bg-muted">${lineTotal(item).toFixed(2)}</div>
                    </div>
                    <Button type="button" variant="ghost" onClick={() => handleRemoveOrderItem(idx)}>
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddOrderItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
                {validationErrors.items && <p className="text-sm text-destructive">{validationErrors.items}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-4 items-center">
              <div className="font-semibold">Order Total: ${orderTotal.toFixed(2)}</div>
                </div>
              </>
            )}
              <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {editingOrder ? "Update" : "Create"} Order
              </Button>
              <Button type="button" variant="ghost" onClick={() => {
                setAddDialogOpen(false);
                setEditDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete order #{toDelete?.order_id}? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 