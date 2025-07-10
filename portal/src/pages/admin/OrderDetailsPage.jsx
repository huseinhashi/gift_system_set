import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, ArrowLeft } from "lucide-react";
import { ROOT_BASE_URL } from "@/lib/axios";

export function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { request, isLoading } = useApiRequest();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch order and items
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
  useEffect(() => {
    fetchOrder();
    fetchOrderItems();
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
              <div className="mt-1">{order.Customer?.phone ?? '-'}</div>
            </div>
            <div>
              <Label>Address</Label>
              <div className="mt-1">{order.Customer?.address ?? '-'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
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
    </div>
  );
} 