import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function OrdersPage() {
  const { toast } = useToast();
  const { request, isLoading } = useApiRequest();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({ customer_id: "" });
  const [orderItems, setOrderItems] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  // Fetch orders, customers, products
  const fetchOrders = async () => {
    const res = await request({ method: "get", url: "/orders" });
    if (res.success) setOrders(res.data);
  };
  const fetchCustomers = async () => {
    const res = await request({ method: "get", url: "/customers" });
    if (res.success) setCustomers(res.data);
  };
  const fetchProducts = async () => {
    const res = await request({ method: "get", url: "/products" });
    if (res.success) setProducts(res.data);
  };
  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  // Add order item row
  const handleAddOrderItem = () => {
    setOrderItems((items) => [
      ...items,
      { product_id: "", quantity: 1 }
    ]);
  };
  // Remove order item row
  const handleRemoveOrderItem = (idx) => {
    setOrderItems((items) => items.filter((_, i) => i !== idx));
  };
  // Change order item
  const handleOrderItemChange = (idx, field, value) => {
    setOrderItems((items) =>
      items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };
  // Prevent duplicate products
  const usedProductIds = orderItems.map((item) => item.product_id).filter(Boolean);

  // Calculate line and total price (optimistic UI)
  const getProductPrice = (product_id) => {
    const p = products.find((p) => String(p.product_id) === String(product_id));
    return p ? Number(p.price) : 0;
  };
  const getProductStock = (product_id) => {
    const p = products.find((p) => String(p.product_id) === String(product_id));
    return p ? Number(p.stock_quantity) : 0;
  };
  const lineTotal = (item) => getProductPrice(item.product_id) * (Number(item.quantity) || 0);
  const orderTotal = orderItems.reduce((sum, item) => sum + lineTotal(item), 0);

  // Handle form field change
  const handleFormChange = (e) => {
    setOrderForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    // Validate
    if (!orderForm.customer_id) {
      setValidationErrors((v) => ({ ...v, customer_id: "Customer is required" }));
      return;
    }
    if (orderItems.length === 0) {
      setValidationErrors((v) => ({ ...v, items: "At least one order item is required" }));
      return;
    }
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.product_id) {
        setValidationErrors((v) => ({ ...v, [`item_${i}_product_id`]: "Product is required" }));
        return;
      }
      if (!item.quantity || Number(item.quantity) < 1) {
        setValidationErrors((v) => ({ ...v, [`item_${i}_quantity`]: "Quantity must be at least 1" }));
        return;
      }
      if (Number(item.quantity) > getProductStock(item.product_id)) {
        setValidationErrors((v) => ({ ...v, [`item_${i}_quantity`]: "Exceeds available stock" }));
        return;
      }
    }
    // Prepare payload
    const payload = {
      order: { customer_id: Number(orderForm.customer_id) },
      items: orderItems.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      })),
    };
    try {
      await request({
        method: "post",
        url: "/orders/bulk",
        data: payload,
      });
      toast({ title: "Order created successfully" });
      setAddDialogOpen(false);
      setOrderForm({ customer_id: "" });
      setOrderItems([]);
      fetchOrders();
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  // Get customer name by id
  const getCustomerName = (id) => {
    const c = customers.find((c) => String(c.customer_id) === String(id));
    return c ? c.name : id;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Orders</h2>
        <Button onClick={() => setAddDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Order</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.order_id}>
                <TableCell>{order.order_id ?? '-'}</TableCell>
                <TableCell>{getCustomerName(order.customer_id) ?? '-'}</TableCell>
                <TableCell>{order.total_amount !== undefined ? `$${Number(order.total_amount).toFixed(2)}` : '-'}</TableCell>
                <TableCell>{order.status ?? '-'}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => navigate(`/orders/${order.order_id}`)}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Add Order Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Order</DialogTitle>
            <DialogDescription>Create a new order and add items.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                        value={item.quantity}
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
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>Create Order</Button>
                <Button type="button" variant="ghost" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 