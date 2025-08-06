import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Inline adminSchema for frontend validation
const adminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  wallet_address: z.string().min(42, "Wallet address must be 42 characters").max(42, "Wallet address must be 42 characters"),
  role: z.enum(["admin", "staff"]).default("staff"),
  is_active: z.boolean().optional(),
});

export const AdminsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    wallet_address: "",
    role: "staff",
    is_active: true,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const { toast } = useToast();

  const columns = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => row.getValue("name") ?? '-' },
    { accessorKey: "email", header: "Email", cell: ({ row }) => row.getValue("email") ?? '-' },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.getValue("phone") ?? '-' },
    { 
      accessorKey: "wallet_address", 
      header: "Wallet Address", 
      cell: ({ row }) => {
        const address = row.getValue("wallet_address");
        return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '-';
      }
    },
    { accessorKey: "role", header: "Role", cell: ({ row }) => row.getValue("role") ?? '-' },
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
    fetchAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [searchTerm, admins]);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admins");
      setAdmins(response.data.data);
      setFilteredAdmins(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch admins",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAdmins = () => {
    const filtered = admins.filter((admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAdmins(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      wallet_address: "",
      role: "staff",
      is_active: true,
    });
    setValidationErrors({});
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setFormData({ ...admin });
    setValidationErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAdd = async () => {
    try {
      adminSchema.parse(formData);
      await api.post("/admins", formData);
      toast({ title: "Success", description: "Admin added successfully" });
      fetchAdmins();
      setIsAddDialogOpen(false);
    } catch (error) {
      if (error.errors) {
        // Zod validation errors
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
      } else if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to add admin" });
      }
    }
  };

  const handleEdit = async () => {
    try {
      const dataToSend = { ...formData };
      adminSchema.partial().parse(dataToSend);
      await api.put(`/admins/${selectedAdmin.admin_id}`, dataToSend);
      toast({ title: "Success", description: "Admin updated successfully" });
      fetchAdmins();
      setIsEditDialogOpen(false);
    } catch (error) {
      if (error.errors) {
        const errors = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setValidationErrors(errors);
      } else if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to update admin" });
      }
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admins/${selectedAdmin.admin_id}`);
      toast({ title: "Success", description: "Admin deleted successfully" });
      fetchAdmins();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete admin" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Admins</h2>
        <Button onClick={handleAddClick}>Add Admin</Button>
      </div>
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search admins by name, email, or wallet address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable columns={columns} data={filteredAdmins} isLoading={isLoading} />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive">{validationErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet_address">Wallet Address *</Label>
              <Input
                id="wallet_address"
                name="wallet_address"
                placeholder="0x..."
                value={formData.wallet_address}
                onChange={handleInputChange}
              />
              {validationErrors.wallet_address && (
                <p className="text-sm text-destructive">{validationErrors.wallet_address}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-2"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
              {validationErrors.role && (
                <p className="text-sm text-destructive">{validationErrors.role}</p>
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
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive">{validationErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet_address">Wallet Address *</Label>
              <Input
                id="wallet_address"
                name="wallet_address"
                placeholder="0x..."
                value={formData.wallet_address}
                onChange={handleInputChange}
              />
              {validationErrors.wallet_address && (
                <p className="text-sm text-destructive">{validationErrors.wallet_address}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-2"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
              {validationErrors.role && (
                <p className="text-sm text-destructive">{validationErrors.role}</p>
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
            <DialogTitle>Delete Admin</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this admin?</p>
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