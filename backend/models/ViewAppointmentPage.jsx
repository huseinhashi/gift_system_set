//npm install jspdf jspdf-autotable
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, FileText, CreditCard, Plus, Edit, Trash2, Eye,Star } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const ViewAppointmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMedicalRecordDialogOpen, setIsMedicalRecordDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState({ type: '', id: null });
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { toast } = useToast();
  const { request } = useApiRequest();

  // Medical Record form state
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    record_type: "",
    description: "",
    file: null,
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_type: "initial_consultation",
    status: "pending",
    note: "",
  });

  const paymentTypes = [
    "initial_consultation",
    "followup",
    "test",
    "prescription",
    "other"
  ];

  const paymentStatuses = [
    "pending",
    "paid",
    "failed"
  ];

  const recordTypes = [
    "diagnosis",
    "prescription",
    "test_result",
    "external_upload",
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch medications for selector
  const [medicationsList, setMedicationsList] = useState([]);
  useEffect(() => {
    if (isMedicalRecordDialogOpen) {
      request({ method: 'GET', url: '/medications' })
        .then(res => setMedicationsList(res.data || []));
    }
  }, [isMedicalRecordDialogOpen]);

  // 2. Prescription items state
  const [prescriptionItems, setPrescriptionItems] = useState([]);

  // 3. Add/remove prescription item rows
  const handleAddPrescriptionItem = () => {
    setPrescriptionItems([...prescriptionItems, { medication_id: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };
  const handleRemovePrescriptionItem = (idx) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };
  const handlePrescriptionItemChange = (idx, field, value) => {
    setPrescriptionItems(prescriptionItems.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  // 4. When editing, load prescription items
  useEffect(() => {
    if (selectedMedicalRecord && selectedMedicalRecord.record_type === 'prescription') {
      setPrescriptionItems(selectedMedicalRecord.Prescription_items || []);
    } else {
      setPrescriptionItems([]);
    }
  }, [selectedMedicalRecord, isMedicalRecordDialogOpen]);

  // Medical Records Table Columns
  const medicalRecordColumns = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("createdAt");
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      accessorKey: "record_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("record_type");
        return (
          <Badge variant="outline" className="capitalize">
            {type.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "file_url",
      header: "File",
      cell: ({ row }) => {
        const fileUrl = row.getValue("file_url");
        return fileUrl ? (
          <a
            href={`http://localhost:3200/uploads/${fileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View File
          </a>
        ) : (
          "No file"
        );
      },
    },
    {
      accessorKey: "PrescriptionItems",
      header: "Prescribed Medications",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="mt-2 space-y-1">
            <div className="font-semibold">Prescribed Medications:</div>
            <ul className="list-disc ml-6">
              {record.PrescriptionItems && record.PrescriptionItems.length > 0 ? (
                record.PrescriptionItems.map((item, idx) => (
                  <li key={idx}>
                    {item.Medication?.name || 'Medication'} - {item.dosage}, {item.frequency}, {item.duration}, {item.instructions}
                  </li>
                ))
              ) : (
                "No medications prescribed"
              )}
            </ul>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleEditMedicalRecord(record)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDeleteMedicalRecord(record.id)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Payments Table Columns
  const paymentColumns = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("createdAt");
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount");
        if (amount === null || amount === undefined) return "$0.00";
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `$${isNaN(numAmount) ? "0.00" : numAmount.toFixed(2)}`;
      },
    },
    {
      accessorKey: "payment_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("payment_type");
        return (
          <Badge variant="outline" className="capitalize">
            {type.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          completed: "bg-green-100 text-green-800",
          failed: "bg-red-100 text-red-800",
          refunded: "bg-blue-100 text-blue-800",
        };
        return (
          <Badge className={`capitalize ${statusColors[status]}`}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleEditPayment(payment)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDeletePayment(payment.id)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchAppointmentDetails();
    fetchMedicalRecords();
    fetchPayments();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      const data = await request({
        method: "GET",
        url: `/appointments/${id}`,
      });
      setAppointment(data.data);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      const data = await request({
        method: "GET",
        url: `/medical-records/appointment/${id}`,
      });
      setMedicalRecords(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const fetchPayments = async () => {
    try {
      const data = await request({
        method: "GET",
        url: `/payments/appointment/${id}`,
      });
      setPayments(data.data || []);
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    }
  };

  const handleMedicalRecordSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("appointment_id", parseInt(id));
      formData.append("patient_id", parseInt(appointment.patient_id));
      formData.append("doctor_id", parseInt(appointment.doctor_id));
      formData.append("record_type", medicalRecordForm.record_type);
      formData.append("description", medicalRecordForm.description || "");
      
      if (medicalRecordForm.file) {
        formData.append("file", medicalRecordForm.file);
      }

      const validPrescriptionItems = prescriptionItems.filter(item => item.medication_id);
      if (medicalRecordForm.record_type === 'prescription') {
        formData.append('prescription_items', JSON.stringify(validPrescriptionItems));
      }

      if (selectedMedicalRecord) {
        await request({
          method: "PUT",
          url: `/medical-records/${selectedMedicalRecord.id}`,
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast({
          title: "Success",
          description: "Medical record updated successfully",
        });
      } else {
        await request({
          method: "POST",
          url: "/medical-records",
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast({
          title: "Success",
          description: "Medical record created successfully",
        });
      }
      fetchMedicalRecords();
      setIsMedicalRecordDialogOpen(false);
    } catch (error) {
      console.error("Error saving medical record:", error);
      toast({
        title: "Error",
        description: "Failed to save medical record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async () => {
    setIsSubmitting(true);
    try {
      const paymentData = {
        appointment_id: parseInt(id),
        amount: parseFloat(paymentForm.amount),
        payment_type: paymentForm.payment_type,
        status: paymentForm.status,
        note: paymentForm.note || "Initial payment",
      };

      if (selectedPayment) {
        await request({
          method: "PUT",
          url: `/payments/${selectedPayment.id}`,
          data: paymentData,
        });
        toast({
          title: "Success",
          description: "Payment updated successfully",
        });
      } else {
        await request({
          method: "POST",
          url: "/payments",
          data: paymentData,
        });
        toast({
          title: "Success",
          description: "Payment created successfully",
        });
      }
      fetchPayments();
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        title: "Error",
        description: "Failed to save payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedicalRecord = async (recordId) => {
    setDeleteItem({ type: 'medicalRecord', id: recordId });
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePayment = async (paymentId) => {
    setDeleteItem({ type: 'payment', id: paymentId });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      switch (deleteItem.type) {
        case 'medicalRecord':
          await request({
            method: "DELETE",
            url: `/medical-records/${deleteItem.id}`,
          });
          toast({
            title: "Success",
            description: "Medical record deleted successfully",
          });
          fetchMedicalRecords();
          break;
        case 'payment':
          await request({
            method: "DELETE",
            url: `/payments/${deleteItem.id}`,
          });
          toast({
            title: "Success",
            description: "Payment deleted successfully",
          });
          fetchPayments();
          break;
      }
    } catch (error) {
      // Error is already handled by the useApiRequest hook
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteItem({ type: '', id: null });
    }
  };

  const handleEditMedicalRecord = (record) => {
    setSelectedMedicalRecord(record);
    setMedicalRecordForm({
      record_type: record.record_type,
      description: record.description || "",
      file: null,
    });
    if (record.record_type === 'prescription' && record.PrescriptionItems) {
      setPrescriptionItems(
        record.PrescriptionItems.map(item => ({
          medication_id: item.medication_id?.toString() || "",
          dosage: item.dosage || "",
          frequency: item.frequency || "",
          duration: item.duration || "",
          instructions: item.instructions || "",
        }))
      );
    } else {
      setPrescriptionItems([]);
    }
    setIsMedicalRecordDialogOpen(true);
  };

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setPaymentForm({
      amount: payment.amount.toString(),
      payment_type: payment.payment_type,
      status: payment.status,
      note: payment.note,
    });
    setIsPaymentDialogOpen(true);
  };

const handleGeneratePdf = () => {
  if (!medicalRecords.length) return;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Colors
  const primaryColor = [41, 128, 185]; // Blue
  const secondaryColor = [52, 73, 94]; // Dark gray
  const lightGray = [236, 240, 241];
  const darkGray = [127, 140, 141];
  
  // Header section with background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDICAL RECORDS REPORT', pageWidth / 2, 18, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Patient Medical History', pageWidth / 2, 28, { align: 'center' });
  
  // Patient Information Card
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, 50, pageWidth - 28, 35, 3, 3, 'F');
  
  // Patient info content
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', 20, 62);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${appointment.patient?.name || 'N/A'}`, 20, 72);
  doc.text(`Email: ${appointment.patient?.email || 'N/A'}`, 20, 80);
  
  const rightColumnX = pageWidth / 2 + 10;
  doc.text(`Phone: ${appointment.patient?.phone || 'N/A'}`, rightColumnX, 72);
  doc.text(`Appointment Date: ${format(new Date(appointment.appointment_date), "MMMM d, yyyy")}`, rightColumnX, 80);
  
  // Summary statistics
  const totalRecords = medicalRecords.length;
  const recordTypes = [...new Set(medicalRecords.map(r => r.record_type))];
  const recordsWithFiles = medicalRecords.filter(r => r.file_url).length;
  
  // Statistics section
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, 95, pageWidth - 28, 25, 3, 3, 'F');
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY STATISTICS', 20, 107);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Records: ${totalRecords}`, 20, 115);
  doc.text(`Record Types: ${recordTypes.length}`, 90, 115);
  doc.text(`Records with Files: ${recordsWithFiles}`, 160, 115);
  
  // Prepare enhanced table data
  const tableData = medicalRecords.map((rec, index) => [
    (index + 1).toString(),
    format(new Date(rec.createdAt), "MMM d, yyyy"),
    rec.record_type.replace("_", " ").toUpperCase(),
    rec.description || "No description provided",
    rec.file_url ? "✓ Available" : "✗ None",
  ]);
  
  // Generate table with enhanced styling
  try {
    autoTable(doc, {
      startY: 130,
      head: [["#", "Date", "Type", "Description", "File"]],
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
          cellWidth: 15,
          fillColor: [245, 245, 245],
          fontStyle: 'bold',
        },
        1: { 
          halign: 'center', 
          cellWidth: 30,
        },
        2: { 
          halign: 'center', 
          cellWidth: 35,
          fontStyle: 'bold',
        },
        3: { 
          cellWidth: 80,
        },
        4: { 
          halign: 'center', 
          cellWidth: 25,
          fontStyle: 'bold',
        },
      },
      margin: { top: 130, left: 14, right: 14 },
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
    doc.text('This report was generated automatically and contains confidential medical information.', 20, finalY + 32);
    doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, 20, finalY + 42);
    
    // Add a small medical icon using text
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('⚕', pageWidth - 30, finalY + 38);
  }
  
  // Save with enhanced filename
  const patientName = appointment.patient?.name?.replace(/\s+/g, '_') || 'patient';
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  doc.save(`Medical_Records_${patientName}_${dateStr}.pdf`);
  
  // Show success message
  toast({
    title: "Success",
    description: "Professional PDF report generated successfully",
  });
};

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!appointment) {
    return <div>Appointment not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/admin/appointments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appointments
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Information</CardTitle>
            <CardDescription>Details of the appointment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(appointment.appointment_date), "MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{appointment.time_slot?.start_time} - {appointment.time_slot?.end_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge className={`capitalize ${
                appointment.status === "completed" ? "bg-green-100 text-green-800" :
                appointment.status === "cancelled" ? "bg-red-100 text-red-800" :
                "bg-blue-100 text-blue-800"
              }`}>
                {appointment.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Details of the patient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{appointment.patient?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{appointment.patient?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{appointment.patient?.phone}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Management</CardTitle>
          <CardDescription>Manage medical records and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="medical-records">
            <TabsList>
              <TabsTrigger value="medical-records">Medical Records</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="medical-records" className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleGeneratePdf}
                  disabled={!medicalRecords.length}
                  variant="secondary"
                >
                  Generate PDF
                </Button>
                <Button onClick={() => {
                  setSelectedMedicalRecord(null);
                  setMedicalRecordForm({
                    record_type: "",
                    description: "",
                    file: null,
                  });
                  setIsMedicalRecordDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medical Record
                </Button>
              </div>
              <DataTable
                columns={medicalRecordColumns}
                data={medicalRecords}
                isLoading={isLoading}
                noResultsMessage="No medical records found"
              />
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => {
                  setSelectedPayment(null);
                  setPaymentForm({
                    amount: "",
                    payment_type: "initial_consultation",
                    status: "pending",
                    note: "",
                  });
                  setIsPaymentDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>
              <DataTable
                columns={paymentColumns}
                data={payments}
                isLoading={isLoading}
                noResultsMessage="No payments found"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Medical Record Dialog */}
      <Dialog open={isMedicalRecordDialogOpen} onOpenChange={setIsMedicalRecordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMedicalRecord ? "Edit Medical Record" : "Add Medical Record"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="record_type">Record Type</Label>
              <Select
                value={medicalRecordForm.record_type}
                onValueChange={(value) =>
                  setMedicalRecordForm((prev) => ({
                    ...prev,
                    record_type: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ").charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={medicalRecordForm.description}
                onChange={(e) =>
                  setMedicalRecordForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter description"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) =>
                  setMedicalRecordForm((prev) => ({
                    ...prev,
                    file: e.target.files[0],
                  }))
                }
              />
            </div>

            {medicalRecordForm.record_type === 'prescription' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Medications</h4>
                  <Button type="button" onClick={handleAddPrescriptionItem} size="sm">Add Medication</Button>
                </div>
                {prescriptionItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <Label>Medication</Label>
                      <Select value={item.medication_id} onValueChange={val => handlePrescriptionItemChange(idx, 'medication_id', val)}>
                        <SelectTrigger><SelectValue placeholder="Select medication" /></SelectTrigger>
                        <SelectContent>
                          {medicationsList.map(med => (
                            <SelectItem key={med.id} value={med.id.toString()}>{med.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <Label>Dosage</Label>
                      <Input value={item.dosage} onChange={e => handlePrescriptionItemChange(idx, 'dosage', e.target.value)} placeholder="e.g. 500mg" />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <Label>Frequency</Label>
                      <Input value={item.frequency} onChange={e => handlePrescriptionItemChange(idx, 'frequency', e.target.value)} placeholder="e.g. Twice a day" />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <Label>Duration</Label>
                      <Input value={item.duration} onChange={e => handlePrescriptionItemChange(idx, 'duration', e.target.value)} placeholder="e.g. 7 days" />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <Label>Instructions</Label>
                      <Input value={item.instructions} onChange={e => handlePrescriptionItemChange(idx, 'instructions', e.target.value)} placeholder="e.g. After meals" />
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemovePrescriptionItem(idx)} title="Remove"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMedicalRecordDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMedicalRecordSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {selectedMedicalRecord ? "Updating..." : "Adding..."}
                </>
              ) : (
                selectedMedicalRecord ? "Update Medical Record" : "Add Medical Record"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPayment ? "Edit Payment" : "Add Payment"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                placeholder="Enter amount"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment_type">Payment Type</Label>
              <Select
                value={paymentForm.payment_type}
                onValueChange={(value) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    payment_type: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={paymentForm.status}
                onValueChange={(value) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    status: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={paymentForm.note}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    note: e.target.value,
                  }))
                }
                placeholder="Enter payment note"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePaymentSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {selectedPayment ? "Updating..." : "Adding..."}
                </>
              ) : (
                selectedPayment ? "Update Payment" : "Add Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this {deleteItem.type}? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 