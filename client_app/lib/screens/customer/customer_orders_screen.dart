import 'package:client_app/services/order_service.dart';
import 'package:flutter/material.dart';
import 'package:client_app/services/customer_order_service.dart';
import 'package:google_fonts/google_fonts.dart';

class CustomerOrdersScreen extends StatefulWidget {
  const CustomerOrdersScreen({Key? key}) : super(key: key);

  @override
  State<CustomerOrdersScreen> createState() => _CustomerOrdersScreenState();
}

class _CustomerOrdersScreenState extends State<CustomerOrdersScreen> {
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
        .where(
            (order) => (order['status'] ?? '').toLowerCase() == _filterStatus)
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('My Orders', style: GoogleFonts.poppins()),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
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
            Divider(
                height: 1, thickness: 1, color: Colors.grey.withOpacity(0.2)),
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
    double total = 0.0;
    final rawTotal = order['total_amount'] ?? order['totalAmount'] ?? 0;
    if (rawTotal is double) {
      total = rawTotal;
    } else if (rawTotal is int) {
      total = rawTotal.toDouble();
    } else if (rawTotal is String) {
      total = double.tryParse(rawTotal) ?? 0.0;
    }
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
            if (createdAt != null && createdAt != '')
              Text('Date: ${createdAt.toString().substring(0, 10)}',
                  style: GoogleFonts.poppins(fontSize: 12)),
            Text('Total: \$${total.toStringAsFixed(2)}',
                style: GoogleFonts.poppins(fontSize: 12)),
          ],
        ),
        trailing: Icon(Icons.arrow_forward_ios,
            size: 18, color: theme.colorScheme.primary),
        onTap: () {
          _showOrderDetailsModal(order, theme);
        },
      ),
    );
  }

  void _showOrderDetailsModal(dynamic order, ThemeData theme) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return OrderDetailsSheet(order: order);
      },
    );
  }
}

class OrderDetailsSheet extends StatefulWidget {
  final dynamic order;
  const OrderDetailsSheet({Key? key, required this.order}) : super(key: key);

  @override
  State<OrderDetailsSheet> createState() => _OrderDetailsSheetState();
}

class _OrderDetailsSheetState extends State<OrderDetailsSheet> {
  bool _isPaying = false;
  String? _payError;
  String? _paySuccess;

  Future<void> _processPayment() async {
    setState(() {
      _isPaying = true;
      _payError = null;
      _paySuccess = null;
    });
    try {
      // Use the payment logic from OrderService
      final orderId = widget.order['order_id'] ?? widget.order['id'];
      final total =
          widget.order['total_amount'] ?? widget.order['totalAmount'] ?? 0;
      final customerPhone = widget.order['customer']?['phone'] ?? '';
      final result = await OrderService.processPayment(
        orderId: orderId,
        amount: total is String
            ? double.tryParse(total) ?? 0.0
            : (total is int ? total.toDouble() : total),
        customerPhone: customerPhone,
      );
      if (result['success']) {
        setState(() {
          _paySuccess = 'Payment successful!';
        });
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
    final order = widget.order;
    final orderItems = order['order_items'] ?? [];
    final delivery = order['delivery'];
    final paymentStatus =
        (order['payment_status'] ?? '').toString().toLowerCase();
    final status = (order['status'] ?? '').toString().toLowerCase();
    final total = order['total_amount'] ?? order['totalAmount'] ?? 0;
    final customer = order['customer'] ?? {};
    final employee = delivery != null ? delivery['employee'] : null;
    return Padding(
      padding: MediaQuery.of(context).viewInsets,
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text('Order #${order['order_id'] ?? order['id']}',
                  style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold, fontSize: 20)),
              const SizedBox(height: 8),
              Text('Status: ${status.toUpperCase()}',
                  style: GoogleFonts.poppins(fontSize: 14)),
              Text('Payment Status: ${paymentStatus.toUpperCase()}',
                  style: GoogleFonts.poppins(fontSize: 14)),
              const SizedBox(height: 16),
              Text('Order Items:',
                  style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold, fontSize: 16)),
              ...orderItems.map<Widget>((item) {
                final product = item['product'] ?? {};
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: product['image_url'] != null
                      ? Image.network(
                          'http://localhost:2322/images/${product['image_url']}',
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover)
                      : Container(
                          width: 48,
                          height: 48,
                          color: Colors.grey[200],
                          child: Icon(Icons.image, color: Colors.grey)),
                  title: Text(product['name'] ?? 'Product',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w500)),
                  subtitle: Text('Qty: ${item['quantity']}'),
                  trailing: Text('4${item['price']}',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                );
              }).toList(),
              const SizedBox(height: 16),
              Text('Total: 4${total.toString()}',
                  style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              if (employee != null) ...[
                Text('Delivery Employee:',
                    style: GoogleFonts.poppins(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.person, color: Colors.blue),
                  title: Text(employee['name'] ?? 'N/A',
                      style: GoogleFonts.poppins()),
                  subtitle: Text(employee['phone'] ?? ''),
                ),
              ],
              if (paymentStatus != 'paid') ...[
                const SizedBox(height: 16),
                if (_payError != null)
                  Text(_payError!,
                      style: GoogleFonts.poppins(color: Colors.red)),
                if (_paySuccess != null)
                  Text(_paySuccess!,
                      style: GoogleFonts.poppins(color: Colors.green)),
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
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
