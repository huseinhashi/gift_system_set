import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { z } from "zod";

// Inline customerSchema for frontend validation
const customerSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .refine((val) => !/^\d/.test(val), "Name cannot start with a number")
    .refine((val) => !/^\s/.test(val), "Name cannot start with a space")
    .refine((val) => !/\s$/.test(val), "Name cannot end with a space")
    .refine((val) => !/\s{2,}/.test(val), "Name cannot contain consecutive spaces"),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[\d\s\-\+\(\)]+$/.test(val), "Phone can only contain numbers, spaces, hyphens, plus signs, and parentheses")
    .refine((val) => !val || val.length >= 7, "Phone number must be at least 7 characters")
    .refine((val) => !val || val.length <= 20, "Phone number cannot exceed 20 characters"),
  address: z.string()
    .optional()
    .refine((val) => !val || val.length <= 500, "Address cannot exceed 500 characters")
    .refine((val) => !val || !/^\s/.test(val), "Address cannot start with a space")
    .refine((val) => !val || !/\s$/.test(val), "Address cannot end with a space"),
  password_hash: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters")
    .refine((val) => /^(?=.*[a-zA-Z])/.test(val), "Password must contain at least one letter")
    .refine((val) => /^(?=.*\d)/.test(val), "Password must contain at least one number"),
  is_active: z.boolean().optional(),
});

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password_hash: "",
    address: "",
    is_active: true,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const { toast } = useToast();
  const { request, isLoading } = useApiRequest();

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "is_active", header: "Active", cell: ({ row }) => row.getValue("is_active") ? "Yes" : "No" },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEditClick(row.original)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(row.original)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const data = await request({ method: "get", url: "/customers" });
      setCustomers(data.data);
      setFilteredCustomers(data.data);
    } catch {}
  };

  const filterCustomers = () => {
    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || "").includes(searchTerm)
    );
    setFilteredCustomers(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      phone: "",
      password_hash: "",
      address: "",
      is_active: true,
    });
    setValidationErrors({});
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...customer, password_hash: "" });
    setValidationErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAdd = async () => {
    try {
      customerSchema.parse(formData);
      await request({ method: "post", url: "/customers/register", data: formData }, { successMessage: "Customer added successfully" });
      fetchCustomers();
      setIsAddDialogOpen(false);
    } catch (error) {
      if (error.errors) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleEdit = async () => {
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password_hash) delete dataToSend.password_hash;
      customerSchema.partial().parse(dataToSend);
      await request({ method: "put", url: `/customers/${selectedCustomer.customer_id}`, data: dataToSend }, { successMessage: "Customer updated successfully" });
      fetchCustomers();
      setIsEditDialogOpen(false);
    } catch (error) {
      if (error.errors) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleDelete = async () => {
    try {
      await request({ method: "delete", url: `/customers/${selectedCustomer.customer_id}` }, { successMessage: "Customer deleted successfully" });
      fetchCustomers();
      setIsDeleteDialogOpen(false);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Total Customers: {customers.length}</div>
            <Button onClick={handleAddClick}>Add Customer</Button>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search customers by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable columns={columns} data={filteredCustomers} isLoading={isLoading} />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                pattern="[a-zA-Z\s]+"
                title="Name can only contain letters and spaces"
                maxLength={100}
                required
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                pattern="[\d\s\-\+\(\)]+"
                title="Phone can only contain numbers, spaces, hyphens, plus signs, and parentheses"
                maxLength={20}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive">{validationErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_hash">Password</Label>
              <Input
                id="password_hash"
                name="password_hash"
                type="password"
                value={formData.password_hash}
                onChange={handleInputChange}
                minLength={6}
                maxLength={100}
                required
              />
              {validationErrors.password_hash && (
                <p className="text-sm text-destructive">{validationErrors.password_hash}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                maxLength={500}
              />
              {validationErrors.address && (
                <p className="text-sm text-destructive">{validationErrors.address}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </form>
          <DialogFooter>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                pattern="[a-zA-Z\s]+"
                title="Name can only contain letters and spaces"
                maxLength={100}
                required
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                pattern="[\d\s\-\+\(\)]+"
                title="Phone can only contain numbers, spaces, hyphens, plus signs, and parentheses"
                maxLength={20}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive">{validationErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_hash">New Password (leave blank to keep current)</Label>
              <Input
                id="password_hash"
                name="password_hash"
                type="password"
                value={formData.password_hash}
                onChange={handleInputChange}
                minLength={6}
                maxLength={100}
              />
              {validationErrors.password_hash && (
                <p className="text-sm text-destructive">{validationErrors.password_hash}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                maxLength={500}
              />
              {validationErrors.address && (
                <p className="text-sm text-destructive">{validationErrors.address}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </form>
          <DialogFooter>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this customer?</p>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 