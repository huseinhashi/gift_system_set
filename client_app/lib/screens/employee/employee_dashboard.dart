import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/customer_order_service.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../widgets/mapbox_widget.dart';

class EmployeeDashboardScreen extends StatefulWidget {
  const EmployeeDashboardScreen({Key? key}) : super(key: key);

  @override
  State<EmployeeDashboardScreen> createState() =>
      _EmployeeDashboardScreenState();
}

class _EmployeeDashboardScreenState extends State<EmployeeDashboardScreen> {
  int _currentIndex = 0;

  // Moved deliveries state to parent
  final CustomerOrderService _orderService = CustomerOrderService();
  List<dynamic> _deliveries = [];
  bool _isLoading = true;
  String? _error;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _fetchDeliveries();
  }

  Future<void> _fetchDeliveries() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    final res = await _orderService.getEmployeeDeliveries();
    if (mounted) {
      setState(() {
        if (res['success']) {
          _deliveries = res['data'] ?? [];
          _error = null;
        } else {
          _error = res['message'] ?? 'Failed to load deliveries';
        }
        _isLoading = false;
      });
    }
  }

  Future<void> _updateDeliveryStatus(int deliveryId, String newStatus) async {
    final res = await _orderService
        .updateEmployeeDelivery(deliveryId, {'delivery_status': newStatus});
    if (res['success']) {
      _fetchDeliveries();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Status updated'), backgroundColor: Colors.green),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(res['message'] ?? 'Failed to update'),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  List<dynamic> get _filteredDeliveries {
    if (_filterStatus == 'all') return _deliveries;
    return _deliveries
        .where((d) => d['delivery_status'] == _filterStatus)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userData = authProvider.userData;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Employee Dashboard',
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.person),
            onSelected: (value) {
              switch (value) {
                case 'profile':
                  // Navigate to profile
                  break;
                case 'logout':
                  _showLogoutDialog(context);
                  break;
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    const Icon(Icons.person_outline),
                    const SizedBox(width: 8),
                    Text('Profile', style: GoogleFonts.poppins()),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    const Icon(Icons.logout),
                    const SizedBox(width: 8),
                    Text('Logout', style: GoogleFonts.poppins()),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildHomeTab(),
          _buildProfileTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedItemColor: Theme.of(context).colorScheme.primary,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    return EmployeeDeliveriesTab(
      deliveries: _filteredDeliveries,
      isLoading: _isLoading,
      error: _error,
      filterStatus: _filterStatus,
      onFilterChanged: (status) => setState(() => _filterStatus = status),
      onRefresh: () async => await _fetchDeliveries(),
      onUpdateStatus: _updateDeliveryStatus,
    );
  }

  Widget _buildProfileTab() {
    final authProvider = Provider.of<AuthProvider>(context);
    final userData = authProvider.userData;
    final deliveriesCount = _deliveries.length;
    final deliveredCount =
        _deliveries.where((d) => d['delivery_status'] == 'delivered').length;
    final pendingCount =
        _deliveries.where((d) => d['delivery_status'] == 'pending').length;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Profile',
            style: GoogleFonts.poppins(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(height: 24),
          Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    child: Icon(
                      Icons.person,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    userData?['name'] ?? 'Employee',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    userData?['phone'] ?? '',
                    style: GoogleFonts.poppins(
                      color: Colors.grey[600],
                    ),
                  ),
                  if (userData?['email'] != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      userData!['email'],
                      style: GoogleFonts.poppins(color: Colors.grey[600]),
                    ),
                  ],
                  if (userData?['role'] != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .primary
                            .withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        userData!['role'],
                        style: GoogleFonts.poppins(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildStatCard(
                          'Total Deliveries', deliveriesCount, context),
                      _buildStatCard('Delivered', deliveredCount, context),
                      _buildStatCard('Pending', pendingCount, context),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, int value, BuildContext context) {
    return Column(
      children: [
        Text('$value',
            style: GoogleFonts.poppins(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: Theme.of(context).colorScheme.primary)),
        const SizedBox(height: 4),
        Text(label,
            style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Logout',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to logout?',
          style: GoogleFonts.poppins(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancel', style: GoogleFonts.poppins()),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              final authProvider =
                  Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Colors.white,
            ),
            child: Text('Logout', style: GoogleFonts.poppins()),
          ),
        ],
      ),
    );
  }
}

// --- Employee Deliveries Tab Widget ---
class EmployeeDeliveriesTab extends StatefulWidget {
  final List<dynamic> deliveries;
  final bool isLoading;
  final String? error;
  final String filterStatus;
  final Function(String) onFilterChanged;
  final Future<void> Function() onRefresh;
  final Function(int, String) onUpdateStatus;

  const EmployeeDeliveriesTab({
    Key? key,
    required this.deliveries,
    required this.isLoading,
    required this.error,
    required this.filterStatus,
    required this.onFilterChanged,
    required this.onRefresh,
    required this.onUpdateStatus,
  }) : super(key: key);

  @override
  State<EmployeeDeliveriesTab> createState() => _EmployeeDeliveriesTabState();
}

class _EmployeeDeliveriesTabState extends State<EmployeeDeliveriesTab> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RefreshIndicator(
      onRefresh: widget.onRefresh,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('My Deliveries',
                style: GoogleFonts.poppins(
                    fontSize: 24, fontWeight: FontWeight.bold)),
            Text('Manage your assigned deliveries',
                style:
                    GoogleFonts.poppins(fontSize: 14, color: Colors.grey[600])),
            const SizedBox(height: 16),
            _buildStatusFilter(theme),
            const SizedBox(height: 16),
            Expanded(
              child: widget.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : widget.error != null
                      ? Center(
                          child: Text(widget.error!,
                              style: TextStyle(color: theme.colorScheme.error)))
                      : widget.deliveries.isEmpty
                          ? _buildEmptyState(theme)
                          : ListView.builder(
                              itemCount: widget.deliveries.length,
                              itemBuilder: (context, idx) {
                                final delivery = widget.deliveries[idx];
                                return GestureDetector(
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) =>
                                            EmployeeDeliveryDetailsScreen(
                                                delivery: delivery),
                                      ),
                                    );
                                  },
                                  child: _buildDeliveryCard(delivery, theme),
                                );
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusFilter(ThemeData theme) {
    const statuses = [
      {'label': 'All', 'value': 'all'},
      {'label': 'Pending', 'value': 'pending'},
      {'label': 'In Transit', 'value': 'in_transit'},
      {'label': 'Delivered', 'value': 'delivered'},
      {'label': 'Failed', 'value': 'failed'},
      {'label': 'Returned', 'value': 'returned'},
    ];
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: statuses
            .map((s) => Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: FilterChip(
                    selected: widget.filterStatus == s['value'],
                    label: Text(s['label']!),
                    onSelected: (_) => widget.onFilterChanged(s['value']!),
                    backgroundColor: Colors.grey[200],
                    selectedColor: theme.colorScheme.primary.withOpacity(0.2),
                    checkmarkColor: theme.colorScheme.primary,
                    labelStyle: GoogleFonts.poppins(
                      color: widget.filterStatus == s['value']
                          ? theme.colorScheme.primary
                          : Colors.black87,
                      fontWeight: widget.filterStatus == s['value']
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                ))
            .toList(),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.local_shipping_outlined,
              size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text('No Deliveries',
              style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700])),
          const SizedBox(height: 8),
          Text('You have no assigned deliveries at the moment',
              style: GoogleFonts.poppins(color: Colors.grey[600]),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildDeliveryCard(dynamic delivery, ThemeData theme) {
    final order = delivery['Order'] ?? {};
    final customer = order['Customer'] ?? {};
    final status = delivery['delivery_status'] ?? 'pending';
    final customerName = customer['name'] ?? 'Unknown Customer';
    final customerPhone = customer['phone'] ?? '';
    final address = customer['address'] ?? 'No address';
    final scheduledDate = delivery['scheduled_date'] ?? '';
    final notes = delivery['delivery_notes'] ?? '';
    final deliveryId = delivery['delivery_id'];
    final statusOptions = [
      'pending',
      'in_transit',
      'delivered',
      'failed',
      'returned'
    ];
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.local_shipping, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text('Delivery #$deliveryId',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(_capitalize(status),
                      style: GoogleFonts.poppins(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.person, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(
                    child: Text(customerName,
                        style:
                            GoogleFonts.poppins(fontWeight: FontWeight.bold))),
                if (customerPhone.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.phone, color: Colors.green),
                    onPressed: () => _callCustomer(customerPhone),
                    tooltip: 'Call Customer',
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.location_on, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(
                    child: Text(address,
                        style: GoogleFonts.poppins(color: Colors.grey[700]))),
              ],
            ),
            if (scheduledDate.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.calendar_today, color: Colors.grey[600], size: 18),
                  const SizedBox(width: 8),
                  Text('Scheduled: $scheduledDate',
                      style: GoogleFonts.poppins(
                          fontSize: 13, color: Colors.grey[700])),
                ],
              ),
            ],
            if (notes.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.note, color: Colors.grey[600], size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                      child: Text(notes,
                          style: GoogleFonts.poppins(
                              fontSize: 13, color: Colors.grey[700]))),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Text('Update Status:',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w500)),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: status,
                  items: statusOptions
                      .map((s) => DropdownMenuItem(
                            value: s,
                            child: Text(_capitalize(s)),
                          ))
                      .toList(),
                  onChanged: (newStatus) {
                    if (newStatus != null && newStatus != status) {
                      widget.onUpdateStatus(deliveryId, newStatus);
                    }
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _capitalize(String s) =>
      s.isNotEmpty ? s[0].toUpperCase() + s.substring(1) : s;

  Future<void> _callCustomer(String phone) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phone);
    if (await canLaunch(phoneUri.toString())) {
      await launch(phoneUri.toString());
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Could not call $phone'),
              backgroundColor: Colors.red),
        );
      }
    }
  }
}

// --- Delivery Details Screen ---
class EmployeeDeliveryDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> delivery;
  const EmployeeDeliveryDetailsScreen({Key? key, required this.delivery})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final order = delivery['Order'] ?? {};
    final customer = order['Customer'] ?? {};
    final products = order['OrderItems'] ?? [];
    final status = delivery['delivery_status'] ?? 'pending';
    final scheduledDate = delivery['scheduled_date'] ?? '';
    final notes = delivery['delivery_notes'] ?? '';
    final address = customer['address'] ?? 'No address';
    final customerName = customer['name'] ?? 'Unknown Customer';
    final customerPhone = customer['phone'] ?? '';
    final lat = customer['latitude'];
    final lng = customer['longitude'];
    // If lat/lng are not in customer, try order
    final orderLat = order['latitude'];
    final orderLng = order['longitude'];
    final hasCoords =
        (lat != null && lng != null) || (orderLat != null && orderLng != null);
    final double? mapLat = lat ?? orderLat;
    final double? mapLng = lng ?? orderLng;

    return Scaffold(
      appBar: AppBar(
        title: Text('Delivery Details',
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              elevation: 3,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.local_shipping,
                            color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 8),
                        Text('Delivery #${delivery['delivery_id']}',
                            style: GoogleFonts.poppins(
                                fontWeight: FontWeight.bold)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Theme.of(context)
                                .colorScheme
                                .primary
                                .withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(_capitalize(status),
                              style: GoogleFonts.poppins(
                                  color: Theme.of(context).colorScheme.primary,
                                  fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.person, color: Colors.grey[600]),
                        const SizedBox(width: 8),
                        Expanded(
                            child: Text(customerName,
                                style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.bold))),
                        if (customerPhone.isNotEmpty)
                          IconButton(
                            icon: const Icon(Icons.phone, color: Colors.green),
                            onPressed: () =>
                                _callCustomer(context, customerPhone),
                            tooltip: 'Call Customer',
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.location_on, color: Colors.grey[600]),
                        const SizedBox(width: 8),
                        Expanded(
                            child: Text(address,
                                style: GoogleFonts.poppins(
                                    color: Colors.grey[700]))),
                      ],
                    ),
                    if (scheduledDate.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.calendar_today,
                              color: Colors.grey[600], size: 18),
                          const SizedBox(width: 8),
                          Text('Scheduled: $scheduledDate',
                              style: GoogleFonts.poppins(
                                  fontSize: 13, color: Colors.grey[700])),
                        ],
                      ),
                    ],
                    if (notes.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.note, color: Colors.grey[600], size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                              child: Text(notes,
                                  style: GoogleFonts.poppins(
                                      fontSize: 13, color: Colors.grey[700]))),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (hasCoords && mapLat != null && mapLng != null)
              Card(
                elevation: 3,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Delivery Location',
                          style:
                              GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 220,
                        child: MapboxWidget(
                          latitude: mapLat,
                          longitude: mapLng,
                          title: customerName,
                          address: address,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.map, color: Colors.grey[400]),
                      const SizedBox(width: 12),
                      Expanded(
                          child: Text(
                              'No map location available for this delivery',
                              style: GoogleFonts.poppins(
                                  color: Colors.grey[600]))),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 16),
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Order Details',
                        style:
                            GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    if (products.isNotEmpty)
                      ...products
                          .map<Widget>((item) => Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  children: [
                                    Icon(Icons.shopping_bag,
                                        size: 18,
                                        color: Theme.of(context)
                                            .colorScheme
                                            .primary),
                                    const SizedBox(width: 8),
                                    Expanded(
                                        child: Text(
                                            item['Product']?['name'] ?? '-',
                                            style: GoogleFonts.poppins())),
                                    Text('x${item['quantity']}',
                                        style: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w500)),
                                  ],
                                ),
                              ))
                          .toList()
                    else
                      Text('No products found',
                          style: GoogleFonts.poppins(color: Colors.grey[600])),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _capitalize(String s) =>
      s.isNotEmpty ? s[0].toUpperCase() + s.substring(1) : s;

  void _callCustomer(BuildContext context, String phone) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phone);
    if (await canLaunch(phoneUri.toString())) {
      await launch(phoneUri.toString());
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Could not call $phone'),
            backgroundColor: Colors.red),
      );
    }
  }
}
