import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { z } from "zod";

// Custom payment schema for frontend validation
const paymentSchema = z.object({
  order_id: z.string().min(1, "Order is required"),
  payment_type: z.enum(["api", "cash"]).optional(),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  transaction_id: z.string().optional(),
});

export function PaymentsPage() {
  const { toast } = useToast();
  const { request, isLoading } = useApiRequest();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ order_id: "", payment_type: "cash", amount: "", transaction_id: "" });
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  // Fetch payments and orders
  const fetchPayments = async () => {
    let url = "/payments";
    if (dateFilter.from || dateFilter.to) {
      const params = [];
      if (dateFilter.from) params.push(`from=${dateFilter.from}`);
      if (dateFilter.to) params.push(`to=${dateFilter.to}`);
      url += `?${params.join("&")}`;
    }
    const res = await request({ method: "get", url });
    if (res.success) setPayments(res.data);
  };
  const fetchOrders = async () => {
    const res = await request({ method: "get", url: "/orders" });
    if (res.success) setOrders(res.data);
  };
  useEffect(() => {
    fetchPayments();
    fetchOrders();
    // eslint-disable-next-line
  }, [dateFilter]);

  // Handle dialog open/close
  const handleOpenDialog = (payment = null) => {
    setEditing(payment);
    setValidationErrors({});
    if (payment) {
      setForm({
        order_id: String(payment.order_id),
        payment_type: payment.payment_type,
        amount: String(payment.amount),
        transaction_id: payment.transaction_id || "",
      });
    } else {
      setForm({ order_id: "", payment_type: "cash", amount: "", transaction_id: "" });
    }
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ order_id: "", payment_type: "cash", amount: "", transaction_id: "" });
    setValidationErrors({});
  };

  // Handle form change
  const handleFormChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    
    try {
      // Validate with custom schema
      paymentSchema.parse(form);
    } catch (error) {
      if (error.errors) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
      }
      return;
    }

    try {
      const dataToSend = {
        order_id: Number(form.order_id),
        amount: Number(form.amount),
      };

      // Only include payment_type and transaction_id when editing
      if (editing) {
        dataToSend.payment_type = form.payment_type;
        if (form.transaction_id) {
          dataToSend.transaction_id = form.transaction_id;
        }
      }

      if (editing) {
        await request({ method: "put", url: `/payments/${editing.payment_id}`, data: dataToSend });
        toast({ title: "Payment updated successfully" });
      } else {
        await request({ method: "post", url: "/payments", data: dataToSend });
        toast({ title: "Payment created successfully" });
      }
      fetchPayments();
      handleCloseDialog();
    } catch (error) {
      if (error?.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      }
    }
  };

  // Only show orders that do not already have a payment (except when editing, always include the current order)
  const getAvailableOrders = () => {
    const paidOrderIds = new Set(payments.map((p) => p.order_id));
    return orders.filter((o) => {
      if (editing && String(o.order_id) === String(form.order_id)) return true;
      return !paidOrderIds.has(o.order_id);
    });
  };

  // When order is selected, auto-populate amount
  useEffect(() => {
    if (form.order_id && orders.length > 0) {
      const selectedOrder = orders.find((o) => String(o.order_id) === String(form.order_id));
      if (selectedOrder) {
        setForm((f) => ({ ...f, amount: String(selectedOrder.total_amount || "") }));
      }
    }
    // eslint-disable-next-line
  }, [form.order_id, orders]);

  // Dialog state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Handle delete
  const handleDelete = (payment) => {
    setToDelete(payment);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await request({ method: "delete", url: `/payments/${toDelete.payment_id}` });
      toast({ title: "Payment deleted" });
      fetchPayments();
    } catch (error) {
      // Error handled by useApiRequest
    } finally {
      setDeleteDialogOpen(false);
      setToDelete(null);
    }
  };

  // Date filter change
  const handleDateChange = (e) => {
    setDateFilter((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Payments</h2>
        <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Payment</Button>
      </div>
      <div className="flex gap-4 mb-4">
        <div>
          <Label>Date From</Label>
          <Input type="date" name="from" value={dateFilter.from} onChange={handleDateChange} />
        </div>
        <div>
          <Label>Date To</Label>
          <Input type="date" name="to" value={dateFilter.to} onChange={handleDateChange} />
        </div>
        <Button variant="outline" onClick={() => setDateFilter({ from: "", to: "" })}>Clear</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.payment_id}>
                <TableCell>{payment.order_id ?? '-'}</TableCell>
                <TableCell>{payment.Order?.Customer?.name ?? '-'}</TableCell>
                <TableCell>{payment.Order?.Customer?.phone ?? '-'}</TableCell>
                <TableCell>{payment.amount !== undefined ? `$${Number(payment.amount).toFixed(2)}` : '-'}</TableCell>
                <TableCell>{payment.payment_type ?? '-'}</TableCell>
                <TableCell>{payment.transaction_date ? format(new Date(payment.transaction_date), "yyyy-MM-dd HH:mm") : '-'}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => navigate(`/orders/${payment.order_id}`)}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(payment)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(payment)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Payment" : "Add Payment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Order</Label>
              <Select value={form.order_id} onValueChange={(v) => setForm((f) => ({ ...f, order_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableOrders().map((o) => (
                    <SelectItem key={o.order_id} value={String(o.order_id)}>
                      #{o.order_id} - {o.Customer?.name || o.customer_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.order_id && <p className="text-sm text-destructive">{validationErrors.order_id}</p>}
            </div>
            {editing && (
              <div>
                <Label>Payment Type</Label>
                <Select value={form.payment_type} onValueChange={(v) => setForm((f) => ({ ...f, payment_type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Amount</Label>
              <Input name="amount" type="number" min={0.01} step={0.01} value={form.amount} onChange={handleFormChange} required readOnly />
              {validationErrors.amount && <p className="text-sm text-destructive">{validationErrors.amount}</p>}
            </div>
            {editing && (
              <div>
                <Label>Transaction ID</Label>
                <Input name="transaction_id" value={form.transaction_id} onChange={handleFormChange} />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>{editing ? "Update" : "Add"} Payment</Button>
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this payment?</p>
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