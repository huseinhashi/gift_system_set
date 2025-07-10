import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:client_app/services/customer_order_service.dart';
import 'package:client_app/services/order_service.dart';
import 'package:client_app/screens/customer/product_details_screen.dart';
import 'package:client_app/providers/auth_provider.dart';

class OrdersTab extends StatefulWidget {
  const OrdersTab({Key? key}) : super(key: key);

  @override
  State<OrdersTab> createState() => _OrdersTabState();
}

class _OrdersTabState extends State<OrdersTab> {
  final CustomerOrderService _orderService = CustomerOrderService();
  List<dynamic> _orders = [];
  bool _isLoading = true;
  String? _error;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    final response = await _orderService.getCustomerOrders();
    if (response['success']) {
      setState(() {
        _orders = response['data'] ?? [];
        _isLoading = false;
      });
    } else {
      setState(() {
        _error = response['message'] ?? 'Failed to load orders';
        _isLoading = false;
      });
    }
  }

  List<dynamic> get _filteredOrders {
    if (_filterStatus == 'all') return _orders;
    return _orders
        .where((order) =>
            (order['status'] ?? '').toString().toLowerCase() == _filterStatus)
        .toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.amber;
      case 'confirmed':
        return Colors.blue;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
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
      onRefresh: _fetchOrders,
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
                  'Filter by status:',
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
                      _buildFilterChip('Pending', 'pending'),
                      _buildFilterChip('Confirmed', 'confirmed'),
                      _buildFilterChip('Delivered', 'delivered'),
                      _buildFilterChip('Cancelled', 'cancelled'),
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
                                onPressed: _fetchOrders,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _filteredOrders.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.search_off,
                                      size: 64, color: Colors.grey[400]),
                                  const SizedBox(height: 16),
                                  Text('No orders found',
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
                            itemCount: _filteredOrders.length,
                            itemBuilder: (context, index) {
                              final order = _filteredOrders[index];
                              return _buildOrderCard(order, theme);
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

  Widget _buildOrderCard(dynamic order, ThemeData theme) {
    final status = (order['status'] ?? 'pending').toString().toLowerCase();
    final createdAt = order['created_at'] ?? order['createdAt'] ?? '';
    final total =
        _parseAmount(order['total_amount'] ?? order['totalAmount'] ?? 0);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getStatusColor(status),
          child: Icon(Icons.shopping_bag, color: Colors.white),
        ),
        title: Text('Order #${order['order_id'] ?? order['id']}',
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Status: ${_capitalize(status)}',
                style: GoogleFonts.poppins(color: _getStatusColor(status))),
            if (createdAt != null && createdAt.toString().isNotEmpty)
              Text('Date: ${createdAt.toString().substring(0, 10)}',
                  style: GoogleFonts.poppins(fontSize: 12)),
            Text('Total: \$${total.toStringAsFixed(2)}',
                style: GoogleFonts.poppins(fontSize: 12)),
          ],
        ),
        trailing: Icon(Icons.arrow_forward_ios,
            size: 18, color: theme.colorScheme.primary),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => OrderDetailsScreen(order: order),
            ),
          );
        },
      ),
    );
  }
}

class OrderDetailsScreen extends StatefulWidget {
  final dynamic order;
  const OrderDetailsScreen({Key? key, required this.order}) : super(key: key);

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  bool _isPaying = false;
  String? _payError;
  String? _paySuccess;
  final CustomerOrderService _orderService = CustomerOrderService();
  Map<String, dynamic>? _orderDetails;
  bool _isLoadingDetails = true;

  @override
  void initState() {
    super.initState();
    _loadOrderDetails();
  }

  Future<void> _loadOrderDetails() async {
    setState(() {
      _isLoadingDetails = true;
    });

    try {
      final orderId = widget.order['order_id'] ?? widget.order['id'];
      final response = await _orderService.getCustomerOrderById(orderId);
      if (response['success']) {
        setState(() {
          _orderDetails = response['data'];
          _isLoadingDetails = false;
        });
      } else {
        setState(() {
          _orderDetails = widget.order; // Fallback to original order data
          _isLoadingDetails = false;
        });
      }
    } catch (e) {
      setState(() {
        _orderDetails = widget.order; // Fallback to original order data
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
      _isPaying = true;
      _payError = null;
      _paySuccess = null;
    });
    try {
      final orderId = widget.order['order_id'] ?? widget.order['id'];
      final total = _parseAmount(
          widget.order['total_amount'] ?? widget.order['totalAmount'] ?? 0);
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final customerPhone = authProvider.userData?['phone'] ?? '';

      // Validate required fields
      if (customerPhone.isEmpty) {
        setState(() {
          _payError =
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
          _paySuccess = 'Payment successful!';
        });
        // Refresh order details after payment
        await _loadOrderDetails();
      } else {
        setState(() {
          _payError = result['message'] ?? 'Payment failed.';
        });
      }
    } catch (e) {
      setState(() {
        _payError = 'Payment error: $e';
      });
    } finally {
      setState(() {
        _isPaying = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = _orderDetails ?? widget.order;
    final orderItems = order['OrderItems'] ?? [];
    final delivery = order['Delivery'];
    final payments = order['Payments'] ?? [];
    final paymentStatus =
        (order['payment_status'] ?? '').toString().toLowerCase();
    final status = (order['status'] ?? '').toString().toLowerCase();
    final total =
        _parseAmount(order['total_amount'] ?? order['totalAmount'] ?? 0);
    final customer = order['customer'] ?? {};
    final employee = delivery != null ? delivery['employee'] : null;

    return Scaffold(
      appBar: AppBar(
        title: Text('Order #${order['order_id'] ?? order['id']}',
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
                  // Order Summary Card
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
                              Text('Order Summary',
                                  style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18)),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color:
                                      _getStatusColor(status).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  status.toUpperCase(),
                                  style: GoogleFonts.poppins(
                                    color: _getStatusColor(status),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildInfoRow('Order ID',
                              '#${order['order_id'] ?? order['id']}'),
                          _buildInfoRow(
                              'Date',
                              order['created_at']
                                      ?.toString()
                                      .substring(0, 10) ??
                                  'N/A'),
                          _buildInfoRow(
                              'Total Amount', '\$${total.toStringAsFixed(2)}'),
                          _buildInfoRow(
                              'Payment Status', paymentStatus.toUpperCase()),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Order Items
                  Text('Order Items',
                      style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(height: 8),
                  ...orderItems.map<Widget>((item) {
                    final product = item['Product'] ?? {};
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: product['image_url'] != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  'http://localhost:2322/images/${product['image_url']}',
                                  width: 60,
                                  height: 60,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      Container(
                                    width: 60,
                                    height: 60,
                                    color: Colors.grey[200],
                                    child:
                                        Icon(Icons.image, color: Colors.grey),
                                  ),
                                ),
                              )
                            : Container(
                                width: 60,
                                height: 60,
                                color: Colors.grey[200],
                                child: Icon(Icons.image, color: Colors.grey),
                              ),
                        title: Text(product['name'] ?? 'Product',
                            style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w500)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Quantity: ${item['quantity']}'),
                            Text(
                                'Price: \$${_parseAmount(item['price']).toStringAsFixed(2)}'),
                          ],
                        ),
                        trailing: Text(
                            '\$${(_parseAmount(item['price']) * (item['quantity'] ?? 1)).toStringAsFixed(2)}',
                            style: GoogleFonts.poppins(
                                fontWeight: FontWeight.bold)),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ProductDetailsScreen(
                                productId: product['product_id'] ?? 0,
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  }).toList(),

                  const SizedBox(height: 16),

                  // Payment Information
                  if (payments.isNotEmpty) ...[
                    Text('Payment Information',
                        style: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: payments.map<Widget>((payment) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildInfoRow('Payment Type',
                                    payment['payment_type'] ?? 'N/A'),
                                _buildInfoRow('Transaction ID',
                                    payment['transaction_id'] ?? 'N/A'),
                                _buildInfoRow('Amount',
                                    '\$${_parseAmount(payment['amount']).toStringAsFixed(2)}'),
                                _buildInfoRow(
                                    'Date',
                                    payment['transaction_date']
                                            ?.toString()
                                            .substring(0, 10) ??
                                        'N/A'),
                                if (payments.indexOf(payment) <
                                    payments.length - 1)
                                  const Divider(),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Delivery Information
                  if (delivery != null) ...[
                    Text('Delivery Information',
                        style: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildInfoRow(
                                'Status', delivery['delivery_status'] ?? 'N/A'),
                            if (delivery['delivery_notes'] != null)
                              _buildInfoRow(
                                  'Notes', delivery['delivery_notes']),
                            if (delivery['scheduled_date'] != null)
                              _buildInfoRow(
                                  'Scheduled Date', delivery['scheduled_date']),
                            if (delivery['delivered_at'] != null)
                              _buildInfoRow(
                                  'Delivered At',
                                  delivery['delivered_at']
                                      .toString()
                                      .substring(0, 10)),
                            if (delivery['Employee'] != null) ...[
                              const SizedBox(height: 8),
                              Text('Assigned Employee:',
                                  style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.w500)),
                              Card(
                                color: Colors.blue.withOpacity(0.1),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    children: [
                                      ListTile(
                                        contentPadding: EdgeInsets.zero,
                                        leading: CircleAvatar(
                                          backgroundColor: Colors.blue,
                                          child: Icon(Icons.person,
                                              color: Colors.white),
                                        ),
                                        title: Text(
                                            delivery['Employee']['name'] ??
                                                'N/A',
                                            style: GoogleFonts.poppins(
                                                fontWeight: FontWeight.w600)),
                                        subtitle: Text(delivery['Employee']
                                                ['phone'] ??
                                            ''),
                                        trailing: IconButton(
                                          onPressed: () {
                                            _makePhoneCall(
                                                delivery['Employee']['phone']);
                                          },
                                          icon: Icon(Icons.phone,
                                              color: Colors.green),
                                          tooltip:
                                              'Call ${delivery['Employee']['name']}',
                                        ),
                                      ),
                                      if (delivery['Employee']['phone'] != null)
                                        SizedBox(
                                          width: double.infinity,
                                          child: ElevatedButton.icon(
                                            onPressed: () => _makePhoneCall(
                                                delivery['Employee']['phone']),
                                            icon: Icon(Icons.phone, size: 16),
                                            label: Text(
                                                'Call ${delivery['Employee']['name'] ?? 'Employee'}',
                                                style: GoogleFonts.poppins(
                                                    fontSize: 12)),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.green,
                                              foregroundColor: Colors.white,
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      vertical: 8),
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                              ),
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Payment Button
                  if (paymentStatus != 'paid') ...[
                    if (_payError != null)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red),
                        ),
                        child: Text(_payError!,
                            style: GoogleFonts.poppins(color: Colors.red)),
                      ),
                    if (_paySuccess != null)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green),
                        ),
                        child: Text(_paySuccess!,
                            style: GoogleFonts.poppins(color: Colors.green)),
                      ),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isPaying ? null : _processPayment,
                        icon: _isPaying
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.payment),
                        label: Text(_isPaying ? 'Processing...' : 'Pay Now',
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

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.amber;
      case 'confirmed':
        return Colors.blue;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _makePhoneCall(String? phoneNumber) {
    if (phoneNumber == null || phoneNumber.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('No phone number available'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Launch phone call
    // Note: You'll need to add url_launcher package for this to work
    // For now, we'll show a dialog with the phone number
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Call Employee'),
        content: Text('Call $phoneNumber?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Here you would implement the actual phone call
              // For now, just show a success message
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Calling $phoneNumber...'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: Text('Call'),
          ),
        ],
      ),
    );
  }
}
