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

const DELIVERY_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
  { value: "returned", label: "Returned" },
];

export function DeliveriesPage() {
  const { toast } = useToast();
  const { request, isLoading } = useApiRequest();
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ order_id: "", assigned_to: "", delivery_status: "pending", delivery_notes: "", scheduled_date: "" });
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  // Fetch deliveries, orders, employees
  const fetchDeliveries = async () => {
    const res = await request({ method: "get", url: "/deliveries" });
    if (res.success) setDeliveries(res.data);
  };
  const fetchOrders = async () => {
    const res = await request({ method: "get", url: "/orders" });
    if (res.success) setOrders(res.data);
  };
  const fetchEmployees = async () => {
    const res = await request({ method: "get", url: "/employees" });
    if (res.success) setEmployees(res.data);
  };
  useEffect(() => {
    fetchDeliveries();
    fetchOrders();
    fetchEmployees();
    // eslint-disable-next-line
  }, []);

  // Filter employees to only those not assigned or with delivered/returned deliveries
  const getAvailableEmployees = () => {
    // Employees with no active delivery (not in deliveries with status not delivered/returned)
    const busyIds = new Set(
      deliveries
        .filter((d) => !["delivered", "returned", "failed"].includes(d.delivery_status))
        .map((d) => d.assigned_to)
    );
    
    // If editing, include the currently assigned employee
    if (editing) {
      busyIds.delete(editing.assigned_to);
    }
    
    return employees.filter((e) => !busyIds.has(e.employee_id));
  };

  // Only show orders that do not already have a delivery (except when editing, always include the current order)
  const getAvailableOrders = () => {
    const deliveredOrderIds = new Set(deliveries.map((d) => d.order_id));
    return orders.filter((o) => {
      if (editing && String(o.order_id) === String(form.order_id)) return true;
      return !deliveredOrderIds.has(o.order_id);
    });
  };

  // Handle dialog open/close
  const handleOpenDialog = (delivery = null) => {
    setEditing(delivery);
    setValidationErrors({});
    if (delivery) {
      setForm({
        order_id: String(delivery.order_id),
        assigned_to: String(delivery.assigned_to),
        delivery_status: delivery.delivery_status,
        delivery_notes: delivery.delivery_notes || "",
        scheduled_date: delivery.scheduled_date || "",
      });
    } else {
      setForm({ order_id: "", assigned_to: "", delivery_status: "pending", delivery_notes: "", scheduled_date: "" });
    }
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ order_id: "", assigned_to: "", delivery_status: "pending", delivery_notes: "", scheduled_date: "" });
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
    if (!form.order_id) {
      setValidationErrors((v) => ({ ...v, order_id: "Order is required" }));
      return;
    }
    if (!form.assigned_to) {
      setValidationErrors((v) => ({ ...v, assigned_to: "Employee is required" }));
      return;
    }
    if (!form.scheduled_date) {
      setValidationErrors((v) => ({ ...v, scheduled_date: "Scheduled date is required" }));
      return;
    }
    try {
      const dataToSend = {
        ...form,
        order_id: Number(form.order_id),
        assigned_to: Number(form.assigned_to),
      };
      if (editing) {
        await request({ method: "put", url: `/deliveries/${editing.delivery_id}`, data: dataToSend });
        toast({ title: "Delivery updated successfully" });
      } else {
        await request({ method: "post", url: "/deliveries", data: dataToSend });
        toast({ title: "Delivery created successfully" });
      }
      fetchDeliveries();
      handleCloseDialog();
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  // Dialog state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Handle delete
  const handleDelete = (delivery) => {
    setToDelete(delivery);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await request({ method: "delete", url: `/deliveries/${toDelete.delivery_id}` });
      toast({ title: "Delivery deleted" });
      fetchDeliveries();
    } catch (error) {
      // Error handled by useApiRequest
    } finally {
      setDeleteDialogOpen(false);
      setToDelete(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Deliveries</h2>
        <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Delivery</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((delivery) => (
              <TableRow key={delivery.delivery_id}>
                <TableCell>{delivery.order_id ?? '-'}</TableCell>
                <TableCell>{delivery.Order?.Customer?.name ?? '-'}</TableCell>
                <TableCell>{delivery.Employee?.name ?? '-'}</TableCell>
                <TableCell>{delivery.delivery_status ?? '-'}</TableCell>
                <TableCell>
                  {delivery.scheduled_date ? 
                    (() => {
                      try {
                        return format(new Date(delivery.scheduled_date), "yyyy-MM-dd");
                      } catch (error) {
                        return '-';
                      }
                    })() 
                    : '-'
                  }
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(delivery)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(delivery)}><Trash2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => navigate(`/orders/${delivery.order_id}`)}><Eye className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Edit Delivery" : "Add Delivery"}</DialogTitle>
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
            <div>
              <Label>Employee</Label>
              <Select value={form.assigned_to} onValueChange={(v) => setForm((f) => ({ ...f, assigned_to: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableEmployees().map((e) => (
                    <SelectItem key={e.employee_id} value={String(e.employee_id)}>
                      {e.name} ({e.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.assigned_to && <p className="text-sm text-destructive">{validationErrors.assigned_to}</p>}
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.delivery_status} onValueChange={(v) => setForm((f) => ({ ...f, delivery_status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Scheduled Date</Label>
              <Input 
                name="scheduled_date" 
                type="date" 
                value={form.scheduled_date} 
                onChange={handleFormChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input name="delivery_notes" value={form.delivery_notes} onChange={handleFormChange} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>{editing ? "Update" : "Add"} Delivery</Button>
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Delivery</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this delivery?</p>
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