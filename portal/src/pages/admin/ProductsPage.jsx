import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { ROOT_BASE_URL } from "@/lib/axios";
import { z } from "zod";


const CATEGORY_OPTIONS = [
  { value: "flower_bouquet", label: "Flower Bouquet" },
  { value: "gift_box", label: "Gift Box" },
  { value: "chocolates", label: "Chocolates" },
  { value: "balloons", label: "Balloons" },
  { value: "greeting_card", label: "Greeting Card" },
  { value: "combo_pack", label: "Combo Pack" },
  { value: "plants", label: "Plants" },
  { value: "custom", label: "Custom" },
];

const initialForm = {
  name: "",
  description: "",
  category: "flower_bouquet",
  price: "",
  stock_quantity: 0,
  is_active: true,
  image: null,
};

// Zod schema for product validation (matches backend)
const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150, "Name cannot exceed 150 characters"),
  description: z.string().optional(),
  category: z.enum([
    "flower_bouquet",
    "gift_box",
    "chocolates",
    "balloons",
    "greeting_card",
    "combo_pack",
    "plants",
    "custom",
  ]),
  price: z.preprocess((v) => Number(v), z.number().gt(0, "Price must be greater than 0")),
  stock_quantity: z.preprocess((v) => v === '' ? 0 : Number(v), z.number().int().gt(0, "Stock must be greater than 0").optional()),
  is_active: z.boolean().optional(),
  image: z.any().optional(), // image is handled separately
});

export function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const { request, isLoading } = useApiRequest();

  const fetchProducts = async () => {
    try {
      const data = await request({ method: "get", url: "/products" });
      setProducts(data.data);
    } catch {}
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const handleOpenDialog = (product = null) => {
    setEditing(product);
    setValidationErrors({});
    if (product) {
      setForm({
        ...product,
        image: null,
      });
      setImagePreview(product.image_url ? `${ROOT_BASE_URL}/images/${product.image_url}` : null);
    } else {
      setForm(initialForm);
      setImagePreview(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(initialForm);
    setImagePreview(null);
    setValidationErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else if (type === "file") {
      const file = files[0];
      setForm((f) => ({ ...f, image: file }));
      setImagePreview(file ? URL.createObjectURL(file) : null);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSelectChange = (value) => {
    setForm((f) => ({ ...f, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    // Validate with Zod first
    try {
      // Convert booleans and numbers for validation
      const toValidate = {
        ...form,
        price: Number(form.price),
        stock_quantity: form.stock_quantity === '' ? 0 : Number(form.stock_quantity),
        is_active: !!form.is_active,
      };
      productSchema.parse(toValidate);
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
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "image" && value) {
        formData.append("image", value);
      } else if (key !== "image") {
        // Convert numbers and booleans to proper types
        if (key === "price" || key === "stock_quantity") {
          formData.append(key, Number(value));
        } else if (key === "is_active") {
          formData.append(key, value ? "true" : "false"); // optional: use string for boolean
        } else {
          formData.append(key, value);
        }
      }
    });
    try {
      if (editing) {
        await request({
          method: "put",
          url: `/products/${editing.product_id}`,
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({ title: "Product updated successfully" });
      } else {
        await request({
          method: "post",
          url: "/products",
          data: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({ title: "Product created successfully" });
      }
      fetchProducts();
      handleCloseDialog();
    } catch (error) {
      if (error?.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else if (error?.errors) {
        // Zod errors from frontend validation (if any)
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await request({ method: "delete", url: `/products/${product.product_id}` });
      toast({ title: "Product deleted" });
      fetchProducts();
    } catch (error) {
      // Error handled by useApiRequest
    }
  };

  const handleView = (product) => {
    setViewProduct(product);
    setViewDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Products</h2>
        <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" />Add Product</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.product_id}>
                <TableCell>
                  {product.image_url ? (
                    <img
                      src={`${ROOT_BASE_URL}/images/${product.image_url}`}
                      alt={product.name ?? '-'}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No image</span>
                  )}
                </TableCell>
                <TableCell>{product.name ?? '-'}</TableCell>
                <TableCell>{CATEGORY_OPTIONS.find((c) => c.value === product.category)?.label ?? product.category ?? '-'}</TableCell>
                <TableCell>{product.price !== undefined ? `$${Number(product.price).toFixed(2)}` : '-'}</TableCell>
                <TableCell>{product.stock_quantity ?? '-'}</TableCell>
                <TableCell>
                  <span className={product.is_active ? "text-green-600" : "text-red-600"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleView(product)}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(product)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(product)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update product details." : "Add a new product to the shop."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={form.name} onChange={handleInputChange} required minLength={2} maxLength={150} />
              {validationErrors.name && <p className="text-sm text-destructive">{validationErrors.name}</p>}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea name="description" value={form.description || ""} onChange={handleInputChange} maxLength={500} />
              {validationErrors.description && <p className="text-sm text-destructive">{validationErrors.description}</p>}
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.category && <p className="text-sm text-destructive">{validationErrors.category}</p>}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Price</Label>
                <Input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleInputChange} required />
                {validationErrors.price && <p className="text-sm text-destructive">{validationErrors.price}</p>}
              </div>
              <div className="flex-1">
                <Label>Stock</Label>
                <Input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={handleInputChange} required />
                {validationErrors.stock_quantity && <p className="text-sm text-destructive">{validationErrors.stock_quantity}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Status: {form.is_active ? "Active" : "Inactive"}</Label>
            </div>
            <div>
              <Label>Image</Label>
              <Input name="image" type="file" accept="image/*" onChange={handleInputChange} />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
              )}
              {validationErrors.image_url && <p className="text-sm text-destructive">{validationErrors.image_url}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>{editing ? "Update" : "Add"} Product</Button>
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {viewProduct && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{viewProduct.name}</DialogTitle>
                <DialogDescription>{viewProduct.description} </DialogDescription>
              </DialogHeader>
              {viewProduct.image_url && (
                <img
                  src={`${ROOT_BASE_URL}/images/${viewProduct.image_url}`}
                  alt={viewProduct.name}
                  className="w-full max-h-80 object-contain rounded border"
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <div>{CATEGORY_OPTIONS.find((c) => c.value === viewProduct.category)?.label ?? viewProduct.category ?? '-'}</div>
                </div>
                <div>
                  <Label>Price</Label>
                  <div>{viewProduct.price !== undefined ? `$${Number(viewProduct.price).toFixed(2)}` : '-'}</div>
                </div>
                <div>
                  <Label>Stock</Label>
                  <div>{viewProduct.stock_quantity ?? '-'}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className={viewProduct.is_active ? "text-green-600" : "text-red-600"}>{viewProduct.is_active ? "Active" : "Inactive"}</div>
                </div>
                <div className="col-span-2">
                  <Label>Created At</Label>
                  <div>{new Date(viewProduct.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 