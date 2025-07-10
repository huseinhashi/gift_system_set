import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Inline employeeSchema for frontend validation
const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  password_hash: z.string().min(6, "password_hash must be at least 6 characters").max(100, "password_hash cannot exceed 100 characters"),
  is_active: z.boolean().optional(),
});

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password_hash: "",
    is_active: true,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const { toast } = useToast();

  const columns = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => row.getValue("name") ?? '-' },
    { accessorKey: "email", header: "Email", cell: ({ row }) => row.getValue("email") ?? '-' },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.getValue("phone") ?? '-' },
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
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, employees]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/employees");
      setEmployees(response.data.data);
      setFilteredEmployees(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch employees",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    const filtered = employees.filter((employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password_hash: "",
      is_active: true,
    });
    setValidationErrors({});
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setFormData({ ...employee, password_hash: "" });
    setValidationErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAdd = async () => {
    try {
      employeeSchema.parse(formData);
      await api.post("/employees", formData);
      toast({ title: "Success", description: "Employee added successfully" });
      fetchEmployees();
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
        toast({ variant: "destructive", title: "Error", description: "Failed to add employee" });
      }
    }
  };

  const handleEdit = async () => {
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.password_hash) delete dataToSend.password_hash;
      employeeSchema.partial().parse(dataToSend);
      await api.put(`/employees/${selectedEmployee.employee_id}`, dataToSend);
      toast({ title: "Success", description: "Employee updated successfully" });
      fetchEmployees();
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
        toast({ variant: "destructive", title: "Error", description: "Failed to update employee" });
      }
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/employees/${selectedEmployee.employee_id}`);
      toast({ title: "Success", description: "Employee deleted successfully" });
      fetchEmployees();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete employee" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <Button onClick={handleAddClick}>Add Employee</Button>
      </div>
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search employees by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable columns={columns} data={filteredEmployees} isLoading={isLoading} />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
              <Label htmlFor="password_hash">Password</Label>
              <Input
                id="password_hash"
                name="password_hash"
                type="password"
                value={formData.password_hash}
                onChange={handleInputChange}
              />
              {validationErrors.password_hash && (
                <p className="text-sm text-destructive">{validationErrors.password_hash}</p>
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
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
              <Label htmlFor="password_hash">New Password (leave blank to keep current)</Label>
              <Input
                id="password_hash"
                name="password_hash"
                type="password"
                value={formData.password_hash}
                onChange={handleInputChange}
              />
              {validationErrors.password_hash && (
                <p className="text-sm text-destructive">{validationErrors.password_hash}</p>
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
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this employee?</p>
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