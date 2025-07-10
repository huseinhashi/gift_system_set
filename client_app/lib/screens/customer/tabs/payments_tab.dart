import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:client_app/services/customer_order_service.dart';
import 'package:client_app/services/order_service.dart';
import 'package:client_app/providers/auth_provider.dart';

class PaymentsTab extends StatefulWidget {
  const PaymentsTab({Key? key}) : super(key: key);

  @override
  State<PaymentsTab> createState() => _PaymentsTabState();
}

class _PaymentsTabState extends State<PaymentsTab> {
  final CustomerOrderService _orderService = CustomerOrderService();
  List<dynamic> _payments = [];
  bool _isLoading = true;
  String? _error;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _fetchPayments();
  }

  Future<void> _fetchPayments() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _orderService.getCustomerPayments();
      if (response['success']) {
        setState(() {
          _payments = response['data'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = response['message'] ?? 'Failed to load payments';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading payments: $e';
        _isLoading = false;
      });
    }
  }

  List<dynamic> get _filteredPayments {
    if (_filterStatus == 'all') return _payments;
    return _payments
        .where((payment) =>
            (payment['payment_type'] ?? '').toString().toLowerCase() ==
            _filterStatus)
        .toList();
  }

  Color _getPaymentTypeColor(String type) {
    switch (type) {
      case 'api':
        return Colors.green;
      case 'cash':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _capitalize(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }

  double _parseAmount(dynamic amount) {
    if (amount == null) return 0.0;
    if (amount is double) return amount;
    if (amount is int) return amount.toDouble();
    if (amount is String) {
      return double.tryParse(amount) ?? 0.0;
    }
    return 0.0;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RefreshIndicator(
      onRefresh: _fetchPayments,
      child: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            color: theme.colorScheme.surface,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Filter by type:',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', 'all'),
                      _buildFilterChip('API', 'api'),
                      _buildFilterChip('Cash', 'cash'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, thickness: 1, color: Colors.grey.withOpacity(0.2)),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.error_outline,
                                  size: 64, color: Colors.red),
                              const SizedBox(height: 16),
                              Text(_error!,
                                  style: GoogleFonts.poppins(
                                      fontSize: 16, color: Colors.red)),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _fetchPayments,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _filteredPayments.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.payment_outlined,
                                      size: 64, color: Colors.grey[400]),
                                  const SizedBox(height: 16),
                                  Text('No payments found',
                                      style: GoogleFonts.poppins(
                                          fontSize: 16,
                                          color: Colors.grey[600])),
                                  if (_filterStatus != 'all')
                                    TextButton(
                                      onPressed: () {
                                        setState(() {
                                          _filterStatus = 'all';
                                        });
                                      },
                                      child: Text('Reset filter',
                                          style: GoogleFonts.poppins(
                                              color:
                                                  theme.colorScheme.primary)),
                                    ),
                                ],
                              ),
                            ),
                          )
                        : ListView.builder(
                            itemCount: _filteredPayments.length,
                            itemBuilder: (context, index) {
                              final payment = _filteredPayments[index];
                              return _buildPaymentCard(payment, theme);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final theme = Theme.of(context);
    final isSelected = _filterStatus == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            _filterStatus = value;
          });
        },
        backgroundColor: Colors.grey[200],
        selectedColor: theme.colorScheme.primary.withOpacity(0.1),
        labelStyle: GoogleFonts.poppins(
          color: isSelected ? theme.colorScheme.primary : Colors.black87,
          fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
        ),
        checkmarkColor: theme.colorScheme.primary,
      ),
    );
  }

  Widget _buildPaymentCard(dynamic payment, ThemeData theme) {
    final paymentType =
        (payment['payment_type'] ?? 'api').toString().toLowerCase();
    final transactionDate = payment['transaction_date'] ?? '';
    final amount = _parseAmount(payment['amount']);
    final order = payment['order'] ?? {};
    final orderId = order['order_id'] ?? 'N/A';
    final orderStatus = (order['status'] ?? 'pending').toString().toLowerCase();

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getPaymentTypeColor(paymentType),
          child: Icon(Icons.payment, color: Colors.white),
        ),
        title: Text('Payment #${payment['payment_id']}',
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Type: ${_capitalize(paymentType)}',
                style: GoogleFonts.poppins(
                    color: _getPaymentTypeColor(paymentType))),
            Text('Order #$orderId', style: GoogleFonts.poppins(fontSize: 12)),
            if (transactionDate != null &&
                transactionDate.toString().isNotEmpty)
              Text('Date: ${transactionDate.toString().substring(0, 10)}',
                  style: GoogleFonts.poppins(fontSize: 12)),
            Text('Amount: \$${amount.toStringAsFixed(2)}',
                style: GoogleFonts.poppins(
                    fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
        trailing: Icon(Icons.arrow_forward_ios,
            size: 18, color: theme.colorScheme.primary),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => PaymentDetailsScreen(payment: payment),
            ),
          );
        },
      ),
    );
  }
}

class PaymentDetailsScreen extends StatefulWidget {
  final dynamic payment;
  const PaymentDetailsScreen({Key? key, required this.payment})
      : super(key: key);

  @override
  State<PaymentDetailsScreen> createState() => _PaymentDetailsScreenState();
}

class _PaymentDetailsScreenState extends State<PaymentDetailsScreen> {
  bool _isProcessing = false;
  String? _processError;
  String? _processSuccess;
  Map<String, dynamic>? _paymentDetails;
  bool _isLoadingDetails = true;
  final CustomerOrderService _orderService = CustomerOrderService();

  @override
  void initState() {
    super.initState();
    _loadPaymentDetails();
  }

  Future<void> _loadPaymentDetails() async {
    setState(() {
      _isLoadingDetails = true;
    });

    try {
      final paymentId = widget.payment['payment_id'];
      final response = await _orderService.getCustomerPaymentById(paymentId);
      if (response['success']) {
        setState(() {
          _paymentDetails = response['data'];
          _isLoadingDetails = false;
        });
      } else {
        setState(() {
          _paymentDetails = widget.payment; // Fallback to original payment data
          _isLoadingDetails = false;
        });
      }
    } catch (e) {
      setState(() {
        _paymentDetails = widget.payment; // Fallback to original payment data
        _isLoadingDetails = false;
      });
    }
  }

  double _parseAmount(dynamic amount) {
    if (amount == null) return 0.0;
    if (amount is double) return amount;
    if (amount is int) return amount.toDouble();
    if (amount is String) {
      return double.tryParse(amount) ?? 0.0;
    }
    return 0.0;
  }

  Future<void> _processPayment() async {
    setState(() {
      _isProcessing = true;
      _processError = null;
      _processSuccess = null;
    });

    try {
      final order = widget.payment['order'];
      final orderId = order['order_id'];
      final total = _parseAmount(order['total_amount']);
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final customerPhone = authProvider.userData?['phone'] ?? '';

      // Validate required fields
      if (customerPhone.isEmpty) {
        setState(() {
          _processError =
              'Customer phone number is required for payment processing.';
        });
        return;
      }

      final result = await OrderService.processPayment(
        orderId: orderId,
        amount: total,
        customerPhone: customerPhone,
      );

      if (result['success']) {
        setState(() {
          _processSuccess = 'Payment processed successfully!';
        });
        // Refresh payment details after successful processing
        await _loadPaymentDetails();
      } else {
        setState(() {
          _processError = result['message'] ?? 'Payment processing failed.';
        });
      }
    } catch (e) {
      setState(() {
        _processError = 'Payment error: $e';
      });
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final payment = _paymentDetails ?? widget.payment;
    final order = payment['order'] ?? {};
    final paymentType =
        (payment['payment_type'] ?? 'api').toString().toLowerCase();
    final amount = _parseAmount(payment['amount']);
    final transactionDate = payment['transaction_date'];
    final orderStatus = (order['status'] ?? 'pending').toString().toLowerCase();
    final orderPaymentStatus =
        (order['payment_status'] ?? 'pending').toString().toLowerCase();

    return Scaffold(
      appBar: AppBar(
        title: Text('Payment #${payment['payment_id']}',
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _isLoadingDetails
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Payment Summary Card
                  Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Payment Summary',
                                  style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18)),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: _getPaymentTypeColor(paymentType)
                                      .withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  paymentType.toUpperCase(),
                                  style: GoogleFonts.poppins(
                                    color: _getPaymentTypeColor(paymentType),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildInfoRow(
                              'Payment ID', '#${payment['payment_id']}'),
                          _buildInfoRow('Order ID', '#${order['order_id']}'),
                          _buildInfoRow(
                              'Amount', '\$${amount.toStringAsFixed(2)}'),
                          _buildInfoRow('Transaction ID',
                              payment['transaction_id'] ?? 'N/A'),
                          if (transactionDate != null)
                            _buildInfoRow('Date',
                                transactionDate.toString().substring(0, 19)),
                          _buildInfoRow(
                              'Order Status', orderStatus.toUpperCase()),
                          _buildInfoRow('Payment Status',
                              orderPaymentStatus.toUpperCase()),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Process Payment Button (only for pending payments)
                  if (orderPaymentStatus == 'pending') ...[
                    if (_processError != null)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red),
                        ),
                        child: Text(_processError!,
                            style: GoogleFonts.poppins(color: Colors.red)),
                      ),
                    if (_processSuccess != null)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green),
                        ),
                        child: Text(_processSuccess!,
                            style: GoogleFonts.poppins(color: Colors.green)),
                      ),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isProcessing ? null : _processPayment,
                        icon: _isProcessing
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.payment),
                        label: Text(
                            _isProcessing ? 'Processing...' : 'Process Payment',
                            style: GoogleFonts.poppins()),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: GoogleFonts.poppins(
                  color: Colors.grey[600], fontWeight: FontWeight.w500)),
          Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Color _getPaymentTypeColor(String type) {
    switch (type) {
      case 'api':
        return Colors.green;
      case 'cash':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}
