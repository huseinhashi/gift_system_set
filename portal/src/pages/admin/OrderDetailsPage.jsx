import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, ArrowLeft, Plus, Phone } from "lucide-react";
import { ROOT_BASE_URL } from "@/lib/axios";
import { format } from "date-fns";

export function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);

  // Payment states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ payment_type: "cash", amount: "", transaction_id: "" });

  // Delivery states
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({ assigned_to: "", delivery_status: "pending", delivery_notes: "", scheduled_date: "" });

  // Fetch order and related data
  const fetchOrder = async () => {
    setError(null);
    try {
      const res = await request({ method: "get", url: `/orders/${id}` });
      setOrder(res.data);
    } catch (e) {
      setError("Order not found");
    }
  };

  const fetchOrderItems = async () => {
    setError(null);
    try {
      const res = await request({ method: "get", url: `/order-items/order/${id}` });
      setOrderItems(res.data);
    } catch (e) {
      setError("Failed to load order items");
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await request({ method: "get", url: `/payments/order/${id}` });
      setPayments(res.data.payments || []);
    } catch (e) {
      console.error("Failed to load payments:", e);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const res = await request({ method: "get", url: `/deliveries` });
      const orderDeliveries = res.data.filter(d => d.order_id == id);
      setDeliveries(orderDeliveries);
    } catch (e) {
      console.error("Failed to load deliveries:", e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await request({ method: "get", url: `/employees` });
      setEmployees(res.data);
    } catch (e) {
      console.error("Failed to load employees:", e);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchOrderItems();
    fetchPayments();
    fetchDeliveries();
    fetchEmployees();
    // eslint-disable-next-line
  }, [id]);

  // Helpers
  const canEdit = order && ["pending", "returned"].includes(order.status);
  const orderTotal = orderItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  // Handle view dialog
  const handleView = (item) => setViewItem(item);
  const handleCloseView = () => setViewItem(null);

  // Handle edit dialog
  const handleEdit = (item) => {
    setEditItem(item);
    setEditQuantity(item.quantity);
  };
  const handleCloseEdit = () => {
    setEditItem(null);
    setEditQuantity(1);
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await request({
        method: "put",
        url: `/order-items/${editItem.order_item_id}`,
        data: { quantity: Number(editQuantity) },
      });
      toast({ title: "Order item updated" });
      handleCloseEdit();
      fetchOrderItems();
      fetchOrder();
    } catch (e) {
      toast({ title: "Failed to update item", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (item) => {
    if (!window.confirm("Delete this order item?")) return;
    setDeleteLoading(true);
    try {
      await request({ method: "delete", url: `/order-items/${item.order_item_id}` });
      toast({ title: "Order item deleted" });
      fetchOrderItems();
      fetchOrder();
    } catch (e) {
      toast({ title: "Failed to delete item", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Payment handlers
  const handlePaymentDialog = (payment = null) => {
    setEditingPayment(payment);
    if (payment) {
      setPaymentForm({
        payment_type: payment.payment_type || "cash",
        amount: String(payment.amount || ""),
        transaction_id: payment.transaction_id || "",
      });
    } else {
      setPaymentForm({
        payment_type: "cash",
        amount: String(order?.total_amount || ""),
        transaction_id: "",
      });
    }
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        order_id: Number(id),
        payment_type: paymentForm.payment_type,
        amount: Number(paymentForm.amount),
        transaction_id: paymentForm.transaction_id || null,
      };

      if (editingPayment) {
        await request({ method: "put", url: `/payments/${editingPayment.payment_id}`, data });
        toast({ title: "Payment updated successfully" });
      } else {
        await request({ method: "post", url: `/payments`, data });
        toast({ title: "Payment created successfully" });
      }
      fetchPayments();
      fetchOrder(); // Refresh order to get updated payment status
      setPaymentDialogOpen(false);
      setEditingPayment(null);
    } catch (e) {
      toast({ title: "Failed to save payment", variant: "destructive" });
    }
  };

  const handleDeletePayment = async (payment) => {
    if (!window.confirm("Delete this payment?")) return;
    try {
      await request({ method: "delete", url: `/payments/${payment.payment_id}` });
      toast({ title: "Payment deleted successfully" });
      fetchPayments();
      fetchOrder(); // Refresh order to get updated payment status
    } catch (e) {
      toast({ title: "Failed to delete payment", variant: "destructive" });
    }
  };

  // Delivery handlers
  const handleDeliveryDialog = (delivery = null) => {
    setEditingDelivery(delivery);
    if (delivery) {
      setDeliveryForm({
        assigned_to: String(delivery.assigned_to),
        delivery_status: delivery.delivery_status,
        delivery_notes: delivery.delivery_notes || "",
        scheduled_date: delivery.scheduled_date || "",
      });
    } else {
      setDeliveryForm({
        assigned_to: "",
        delivery_status: "pending",
        delivery_notes: "",
        scheduled_date: "",
      });
    }
    setDeliveryDialogOpen(true);
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        order_id: Number(id),
        assigned_to: Number(deliveryForm.assigned_to),
        delivery_status: deliveryForm.delivery_status,
        delivery_notes: deliveryForm.delivery_notes,
        scheduled_date: deliveryForm.scheduled_date,
      };

      if (editingDelivery) {
        await request({ method: "put", url: `/deliveries/${editingDelivery.delivery_id}`, data });
        toast({ title: "Delivery updated successfully" });
      } else {
        await request({ method: "post", url: `/deliveries`, data });
        toast({ title: "Delivery created successfully" });
      }
      fetchDeliveries();
      fetchOrder(); // Refresh order to get updated status
      setDeliveryDialogOpen(false);
      setEditingDelivery(null);
    } catch (e) {
      toast({ title: "Failed to save delivery", variant: "destructive" });
    }
  };

  const handleDeleteDelivery = async (delivery) => {
    if (!window.confirm("Delete this delivery?")) return;
    try {
      await request({ method: "delete", url: `/deliveries/${delivery.delivery_id}` });
      toast({ title: "Delivery deleted successfully" });
      fetchDeliveries();
      fetchOrder(); // Refresh order to get updated status
    } catch (e) {
      toast({ title: "Failed to delete delivery", variant: "destructive" });
    }
  };

  // Make phone call
  const makePhoneCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_blank');
    }
  };

  if (isLoading && !order) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/orders")}> <ArrowLeft className="h-4 w-4" /> </Button>
        <h2 className="text-2xl font-bold">Order #{order.order_id}</h2>
        <span className="ml-4 text-muted-foreground">Status: {order.status}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Order Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Placed on {new Date(order.created_at).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Total Amount</Label>
              <div className="mt-1 text-lg font-semibold">${orderTotal.toFixed(2)}</div>
            </div>
            <div>
              <Label>Payment Status</Label>
              <div className="mt-1">{order.payment_status}</div>
            </div>
            <div>
              <Label>Delivery Status</Label>
              <div className="mt-1">{order.status}</div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label>Name</Label>
              <div className="mt-1">{order.Customer?.name ?? '-'}</div>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="mt-1 flex items-center gap-2">
                {order.Customer?.phone ?? '-'}
                {order.Customer?.phone && (
                  <Button size="icon" variant="ghost" onClick={() => makePhoneCall(order.Customer.phone)}>
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <div className="mt-1">{order.Customer?.address ?? '-'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payments</CardTitle>
            <CardDescription>Payment history for this order</CardDescription>
          </div>
          <Button onClick={() => handlePaymentDialog()}>
            <Plus className="mr-2 h-4 w-4" />Add Payment
          </Button>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.payment_id}>
                    <TableCell>{payment.payment_type}</TableCell>
                    <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>{payment.transaction_id || '-'}</TableCell>
                    <TableCell>{payment.transaction_date ? format(new Date(payment.transaction_date), "yyyy-MM-dd HH:mm") : '-'}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handlePaymentDialog(payment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeletePayment(payment)} disabled={deleteLoading}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No payments found</div>
          )}
        </CardContent>
      </Card>

      {/* Deliveries Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Deliveries</CardTitle>
            <CardDescription>Delivery information for this order</CardDescription>
          </div>
          <Button onClick={() => handleDeliveryDialog()}>
            <Plus className="mr-2 h-4 w-4" />Add Delivery
          </Button>
        </CardHeader>
        <CardContent>
          {deliveries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.delivery_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {delivery.Employee?.name || '-'}
                        {delivery.Employee?.phone && (
                          <Button size="icon" variant="ghost" onClick={() => makePhoneCall(delivery.Employee.phone)}>
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{delivery.delivery_status}</TableCell>
                    <TableCell>
                      {delivery.scheduled_date ? format(new Date(delivery.scheduled_date), "yyyy-MM-dd") : '-'}
                    </TableCell>
                    <TableCell>{delivery.delivery_notes || '-'}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleDeliveryDialog(delivery)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteDelivery(delivery)} disabled={deleteLoading}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No deliveries found</div>
          )}
        </CardContent>
      </Card>

      {/* Order Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Line Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item) => (
                <TableRow key={item.order_item_id}>
                  <TableCell className="flex items-center gap-2">
                    {item.Product?.image_url ? (
                      <img src={`${ROOT_BASE_URL}/images/${item.Product.image_url}`} alt={item.Product?.name ?? '-'} className="w-10 h-10 object-cover rounded" />
                    ) : null}
                    <span>{item.Product?.name ?? '-'}</span>
                  </TableCell>
                  <TableCell>{item.quantity ?? '-'}</TableCell>
                  <TableCell>{item.price !== undefined ? `$${Number(item.price).toFixed(2)}` : '-'}</TableCell>
                  <TableCell>{item.price !== undefined && item.quantity !== undefined ? `$${(Number(item.price) * Number(item.quantity)).toFixed(2)}` : '-'}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleView(item)}><Eye className="h-4 w-4" /></Button>
                    {canEdit && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(item)} disabled={deleteLoading}><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Item Dialog */}
      <Dialog open={!!viewItem} onOpenChange={handleCloseView}>
        <DialogContent className="max-w-xl">
          {viewItem && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
              </DialogHeader>
              {viewItem.Product?.image_url && (
                <img src={`${ROOT_BASE_URL}/images/${viewItem.Product.image_url}`} alt={viewItem.Product.name} className="w-full max-h-60 object-contain rounded border" />
              )}
              <div>
                <Label>Name</Label>
                <div>{viewItem.Product?.name}</div>
              </div>
              <div>
                <Label>Description</Label>
                <div>{viewItem.Product?.description}</div>
              </div>
              <div>
                <Label>Category</Label>
                <div>{viewItem.Product?.category}</div>
              </div>
              <div>
                <Label>Price</Label>
                <div>${Number(viewItem.Product?.price).toFixed(2)}</div>
              </div>
              <div>
                <Label>Stock</Label>
                <div>{viewItem.Product?.stock_quantity}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={handleCloseEdit}>
        <DialogContent className="max-w-md">
          {editItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Edit Order Item</DialogTitle>
              </DialogHeader>
              <div>
                <Label>Product</Label>
                <div>{editItem.Product?.name}</div>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={editItem.Product?.stock_quantity + editItem.quantity}
                  value={editQuantity}
                  onChange={e => setEditQuantity(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editLoading}>Update</Button>
                <Button type="button" variant="ghost" onClick={handleCloseEdit}>Cancel</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingPayment ? "Edit Payment" : "Add Payment"}</DialogTitle>
            </DialogHeader>
            <div>
              <Label>Payment Type</Label>
              <Select value={paymentForm.payment_type} onValueChange={(v) => setPaymentForm(f => ({ ...f, payment_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Transaction ID (Optional)</Label>
              <Input
                value={paymentForm.transaction_id}
                onChange={(e) => setPaymentForm(f => ({ ...f, transaction_id: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Payment</Button>
              <Button type="button" variant="ghost" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleDeliverySubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingDelivery ? "Edit Delivery" : "Add Delivery"}</DialogTitle>
            </DialogHeader>
            <div>
              <Label>Employee</Label>
              <Select value={deliveryForm.assigned_to} onValueChange={(v) => setDeliveryForm(f => ({ ...f, assigned_to: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.employee_id} value={String(emp.employee_id)}>
                      {emp.name} ({emp.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={deliveryForm.delivery_status} onValueChange={(v) => setDeliveryForm(f => ({ ...f, delivery_status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={deliveryForm.scheduled_date}
                onChange={(e) => setDeliveryForm(f => ({ ...f, scheduled_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={deliveryForm.delivery_notes}
                onChange={(e) => setDeliveryForm(f => ({ ...f, delivery_notes: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Delivery</Button>
              <Button type="button" variant="ghost" onClick={() => setDeliveryDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 