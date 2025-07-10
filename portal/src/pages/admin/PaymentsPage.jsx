import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { Eye, Phone, Calendar, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";

export function PaymentsPage() {
  const { toast } = useToast();
  const { request, isLoading } = useApiRequest();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const res = await request({ method: "get", url: "/payments" });
      if (res.success) setPayments(res.data);
    } catch (e) {
      toast({ title: "Failed to load payments", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...payments];

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
        filtered = filtered.filter(payment => {
          const paymentDate = new Date(payment.transaction_date);
          return paymentDate >= startDate && paymentDate <= endDate;
        });
      }
    }

    // Apply payment type filter
    if (paymentTypeFilter !== "all") {
      filtered = filtered.filter(payment => payment.payment_type === paymentTypeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.Order?.Customer?.name?.toLowerCase().includes(term) ||
        payment.Order?.Customer?.phone?.includes(term) ||
        payment.transaction_id?.toLowerCase().includes(term) ||
        payment.order_id?.toString().includes(term)
      );
    }

    setFilteredPayments(filtered);
  }, [payments, dateFilter, customDateRange, paymentTypeFilter, searchTerm]);

  // Calculate statistics
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalPayments = filteredPayments.length;
  const cashPayments = filteredPayments.filter(p => p.payment_type === "cash").length;
  const apiPayments = filteredPayments.filter(p => p.payment_type === "api").length;

  // Make phone call
  const makePhoneCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payments</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Read-only view</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground">Filtered results</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Filtered results</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashPayments}</div>
            <p className="text-xs text-muted-foreground">Cash transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiPayments}</div>
            <p className="text-xs text-muted-foreground">API transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter payments by date, type, and search terms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
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
              <Label>Payment Type</Label>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search by customer, phone, transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDateFilter("all");
                  setPaymentTypeFilter("all");
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

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Showing {filteredPayments.length} of {payments.length} payments</CardDescription>
        </CardHeader>
        <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
                  <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                {filteredPayments.map((payment) => (
              <TableRow key={payment.payment_id}>
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-normal"
                        onClick={() => navigate(`/orders/${payment.order_id}`)}
                      >
                        #{payment.order_id}
                      </Button>
                    </TableCell>
                <TableCell>{payment.Order?.Customer?.name ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {payment.Order?.Customer?.phone ?? '-'}
                        {payment.Order?.Customer?.phone && (
                          <Button size="icon" variant="ghost" onClick={() => makePhoneCall(payment.Order.Customer.phone)}>
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${Number(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.payment_type === 'cash' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {payment.payment_type}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{payment.transaction_id || '-'}</TableCell>
                <TableCell>{payment.transaction_date ? format(new Date(payment.transaction_date), "yyyy-MM-dd HH:mm") : '-'}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/orders/${payment.order_id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No payments found matching the current filters
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
} 