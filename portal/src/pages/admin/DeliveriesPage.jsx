import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { Eye, Phone, Calendar, Filter, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";

const DELIVERY_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "in_transit", label: "In Transit", color: "bg-blue-100 text-blue-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
  { value: "returned", label: "Returned", color: "bg-orange-100 text-orange-800" },
];

export function DeliveriesPage() {
  const { toast } = useToast();
  const { request, isLoading } = useApiRequest();
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch deliveries
  const fetchDeliveries = async () => {
    try {
      const res = await request({ method: "get", url: "/deliveries" });
      if (res.success) setDeliveries(res.data);
    } catch (e) {
      toast({ title: "Failed to load deliveries", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...deliveries];

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
        filtered = filtered.filter(delivery => {
          const deliveryDate = new Date(delivery.scheduled_date);
          return deliveryDate >= startDate && deliveryDate <= endDate;
        });
      }
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(delivery => delivery.delivery_status === statusFilter);
    }

    // Apply employee filter
    if (employeeFilter !== "all") {
      filtered = filtered.filter(delivery => delivery.assigned_to == employeeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(delivery => 
        delivery.Order?.Customer?.name?.toLowerCase().includes(term) ||
        delivery.Employee?.name?.toLowerCase().includes(term) ||
        delivery.Employee?.phone?.includes(term) ||
        delivery.delivery_notes?.toLowerCase().includes(term) ||
        delivery.order_id?.toString().includes(term)
      );
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, dateFilter, customDateRange, statusFilter, employeeFilter, searchTerm]);

  // Calculate statistics
  const totalDeliveries = filteredDeliveries.length;
  const pendingDeliveries = filteredDeliveries.filter(d => d.delivery_status === "pending").length;
  const inTransitDeliveries = filteredDeliveries.filter(d => d.delivery_status === "in_transit").length;
  const deliveredDeliveries = filteredDeliveries.filter(d => d.delivery_status === "delivered").length;
  const failedDeliveries = filteredDeliveries.filter(d => d.delivery_status === "failed").length;

  // Get unique employees for filter
  const uniqueEmployees = [...new Set(deliveries.map(d => d.Employee?.employee_id))].filter(Boolean);
  const employeeOptions = deliveries
    .filter(d => d.Employee)
    .reduce((acc, delivery) => {
      const employee = delivery.Employee;
      if (!acc.find(e => e.employee_id === employee.employee_id)) {
        acc.push(employee);
      }
      return acc;
    }, []);

  // Make phone call
  const makePhoneCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Deliveries</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Read-only view</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">Filtered results</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDeliveries}</div>
            <p className="text-xs text-muted-foreground">Awaiting pickup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitDeliveries}</div>
            <p className="text-xs text-muted-foreground">On the way</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredDeliveries}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedDeliveries}</div>
            <p className="text-xs text-muted-foreground">Failed deliveries</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter deliveries by date, status, employee, and search terms</CardDescription>
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
                  {DELIVERY_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employee</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employeeOptions.map((employee) => (
                    <SelectItem key={employee.employee_id} value={String(employee.employee_id)}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search by customer, employee, notes..."
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
                  setEmployeeFilter("all");
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

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
          <CardDescription>Showing {filteredDeliveries.length} of {deliveries.length} deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.delivery_id}>
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-normal"
                        onClick={() => navigate(`/orders/${delivery.order_id}`)}
                      >
                        #{delivery.order_id}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{delivery.Order?.Customer?.name || '-'}</div>
                        <div className="text-sm text-muted-foreground">{delivery.Order?.Customer?.phone || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{delivery.Employee?.name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{delivery.Employee?.phone || '-'}</div>
                        </div>
                        {delivery.Employee?.phone && (
                          <Button size="icon" variant="ghost" onClick={() => makePhoneCall(delivery.Employee.phone)}>
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = DELIVERY_STATUS_OPTIONS.find(s => s.value === delivery.delivery_status);
                        return status ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            {delivery.delivery_status}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {delivery.scheduled_date ? format(new Date(delivery.scheduled_date), "yyyy-MM-dd") : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {delivery.delivery_notes || '-'}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/orders/${delivery.order_id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredDeliveries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No deliveries found matching the current filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 