import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, BarChart3, Users, Package, ShoppingCart, CreditCard, Truck, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedReport, setSelectedReport] = useState("summary");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({
    from: null,
    to: null
  });
  const [reportData, setReportData] = useState([]);
  const [reportColumns, setReportColumns] = useState([]);
  const { toast } = useToast();

  const reportTypes = [
    { value: "summary", label: "Summary", icon: BarChart3 },
    { value: "admins", label: "Admins", icon: Users },
    { value: "employees", label: "Employees", icon: Users },
    { value: "customers", label: "Customers", icon: Users },
    { value: "products", label: "Products", icon: Package },
    { value: "orders", label: "Orders", icon: ShoppingCart },
    { value: "payments", label: "Payments", icon: CreditCard },
    { value: "deliveries", label: "Deliveries", icon: Truck },
  ];

  const dateFilters = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "this_month", label: "This Month" },
    { value: "this_year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  useEffect(() => {
    fetchData();
  }, [selectedReport, dateFilter, customDateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      if (selectedReport === "summary") {
        const params = new URLSearchParams({ filter: dateFilter });
        if (dateFilter === "custom" && customDateRange.from && customDateRange.to) {
          params.append("startDate", customDateRange.from.toISOString());
          params.append("endDate", customDateRange.to.toISOString());
        }
        
        const [summaryRes, analyticsRes] = await Promise.all([
          api.get(`/reports/summary?${params}`),
          api.get(`/reports/analytics?${params}`)
        ]);
        
        console.log('Summary response:', summaryRes.data);
        console.log('Analytics response:', analyticsRes.data);
        
        setSummary(summaryRes.data.data);
        setAnalytics(analyticsRes.data.data);
        setReportData([]);
        setReportColumns([]);
      } else {
        const params = new URLSearchParams({ 
          filter: dateFilter,
          type: selectedReport 
        });
        if (dateFilter === "custom" && customDateRange.from && customDateRange.to) {
          params.append("startDate", customDateRange.from.toISOString());
          params.append("endDate", customDateRange.to.toISOString());
        }
        
        const response = await api.get(`/reports/detailed/${selectedReport}?${params}`);
        const data = response.data.data;
        
        setReportData(data.data || []);
        setReportColumns(generateColumns(selectedReport, data.data || []));
        setSummary(null);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch report data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateColumns = (type, data) => {
    if (!data.length) return [];

    const sample = data[0];
    const columns = [];

    Object.keys(sample).forEach(key => {
      if (key !== 'created_at' && key !== 'updated_at') {
        columns.push({
          accessorKey: key,
          header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          cell: ({ row }) => {
            const value = row.getValue(key);
            
            // Handle nested objects (includes) - convert to string representation
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              // For nested objects, show a summary or key information
              if (key === 'Customer' && value.name) {
                return value.name;
              }
              if (key === 'Payment' && value.amount) {
                return `$${parseFloat(value.amount).toFixed(2)}`;
              }
              if (key === 'Employee' && value.name) {
                return value.name;
              }
              if (key === 'Order' && value.order_id) {
                return `Order #${value.order_id}`;
              }
              // For other nested objects, show a generic message
              return 'View Details';
            }
            
            // Handle arrays
            if (Array.isArray(value)) {
              return value.length > 0 ? `${value.length} items` : 'No items';
            }
            
            // Handle wallet addresses
            if (key === 'wallet_address' && value) {
              return `${value.slice(0, 6)}...${value.slice(-4)}`;
            }
            
            // Handle amounts
            if (key === 'amount' && typeof value === 'number') {
              return `$${value.toFixed(2)}`;
            }
            
            // Handle boolean values
            if (key === 'is_active') {
              return value ? "Yes" : "No";
            }
            
            // Handle dates
            if (key === 'created_at' || key === 'transaction_date' || key === 'delivered_at') {
              if (value) {
                return format(new Date(value), 'MMM dd, yyyy');
              }
            }
            
            // Handle null/undefined values
            return value || '-';
          }
        });
      }
    });

    return columns;
  };

  const exportToCSV = () => {
    if (!reportData.length) return;

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedReport);
    
    const fileName = `${selectedReport}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Export Successful",
      description: `Report exported as ${fileName}`,
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Colors
    const primaryColor = [34, 197, 94]; // Emerald
    const secondaryColor = [59, 130, 246]; // Blue
    const lightGray = [248, 250, 252];
    const darkGray = [100, 116, 139];
    
    // Header section with background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('GIFTS SYSTEM REPORT', pageWidth / 2, 18, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report`, pageWidth / 2, 28, { align: 'center' });
    
    // Report Information Card
    doc.setFillColor(...lightGray);
    doc.roundedRect(14, 50, pageWidth - 28, 25, 3, 3, 'F');
    
    // Report info content
    doc.setTextColor(...darkGray);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT INFORMATION', 20, 62);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const dateText = dateFilter === "custom" 
      ? `${format(customDateRange.from, 'MMM dd, yyyy')} - ${format(customDateRange.to, 'MMM dd, yyyy')}`
      : dateFilters.find(f => f.value === dateFilter)?.label || "All Time";
    doc.text(`Date Range: ${dateText}`, 20, 72);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, 80);
    
    // Summary statistics
    const totalRecords = reportData.length;
    
    // Statistics section
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(14, 85, pageWidth - 28, 20, 3, 3, 'F');
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY STATISTICS', 20, 97);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Records: ${totalRecords}`, 20, 105);
    
    // Prepare enhanced table data
    const tableData = reportData.map((row, index) => {
      const rowData = [];
      reportColumns.forEach(col => {
        const value = row[col.accessorKey];
        if (col.accessorKey === 'wallet_address' && value) {
          rowData.push(`${value.slice(0, 6)}...${value.slice(-4)}`);
        } else if (col.accessorKey === 'amount' && typeof value === 'number') {
          rowData.push(`$${value.toFixed(2)}`);
        } else if (col.accessorKey === 'is_active') {
          rowData.push(value ? "Yes" : "No");
        } else {
          rowData.push(value || '-');
        }
      });
      return rowData;
    });
    
    // Generate table with enhanced styling
    try {
      autoTable(doc, {
        startY: 115,
        head: [reportColumns.map(col => col.header)],
        body: tableData,
        theme: 'grid',
        styles: { 
          fontSize: 9,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          textColor: [60, 60, 60],
          font: 'helvetica',
        },
        headStyles: { 
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        columnStyles: {
          0: { 
            halign: 'center', 
            cellWidth: 20,
            fillColor: [245, 245, 245],
            fontStyle: 'bold',
          },
        },
        margin: { top: 115, left: 14, right: 14 },
        tableWidth: 'auto',
        didDrawPage: function (data) {
          // Add page numbers
          doc.setFontSize(8);
          doc.setTextColor(...darkGray);
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth - 30,
            pageHeight - 10
          );
        }
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Footer
    const finalY = doc.lastAutoTable.finalY || 200;
    if (finalY < pageHeight - 50) {
      doc.setFillColor(...lightGray);
      doc.rect(14, finalY + 20, pageWidth - 28, 30, 'F');
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('This report was generated automatically by the Gifts System.', 20, finalY + 32);
      doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, 20, finalY + 42);
      
      // Add a small gift icon using text
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('🎁', pageWidth - 30, finalY + 38);
    }
    
    // Save with enhanced filename
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    doc.save(`${selectedReport}_report_${dateStr}.pdf`);
    
    // Show success message
    toast({
      title: "Success",
      description: "Professional PDF report generated successfully",
    });
  };

  const getSummaryCards = () => {
    if (!analytics) return [];

    return [
      {
        title: "Total Revenue",
        value: `$${analytics.revenue?.total?.toFixed(2) || '0.00'}`,
        icon: TrendingUp,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        title: "Total Orders",
        value: analytics.orders?.total || 0,
        icon: ShoppingCart,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "Total Customers",
        value: summary?.customers || 0, // Use summary for customers count
        icon: Users,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        title: "Total Products",
        value: analytics.products?.total || 0,
        icon: Package,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive reports and analytics for your business
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} disabled={!reportData.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={exportToPDF} disabled={!reportData.length}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date Filter</Label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateFilters.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {dateFilter === "custom" && (
          <div className="space-y-2">
            <Label>Custom Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-48 justify-start text-left font-normal",
                      !customDateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      format(customDateRange.from, "PPP")
                    ) : (
                      <span>Pick a start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customDateRange.from}
                    onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-48 justify-start text-left font-normal",
                      !customDateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.to ? (
                      format(customDateRange.to, "PPP")
                    ) : (
                      <span>Pick an end date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customDateRange.to}
                    onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {selectedReport === "summary" && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getSummaryCards().map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics */}
      {selectedReport === "summary" && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="font-bold">${analytics.revenue?.total?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Order Value:</span>
                <span className="font-bold">${analytics.revenue?.averageOrderValue?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-bold">{analytics.revenue?.totalOrders || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Total Products:</span>
                <span className="font-bold">{analytics.products?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Low Stock Products:</span>
                <span className="font-bold text-red-600">{analytics.products?.lowStock || 0}</span>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analytics.products?.categories || {}).map(([category, count]) => (
                    <Badge key={category} variant="secondary">
                      {category}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      {selectedReport !== "summary" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {reportTypes.find(t => t.value === selectedReport)?.label} Report
              {reportData.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {reportData.length} records
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={reportColumns} 
              data={reportData} 
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 