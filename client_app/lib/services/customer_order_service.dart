import 'api_client.dart';

class CustomerOrderService {
  final ApiClient _apiClient = ApiClient();

  // Get all orders for the logged-in customer
  Future<Map<String, dynamic>> getCustomerOrders() async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/orders/customer/orders',
      );
      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching orders: $e',
        'data': [],
      };
    }
  }

  // Get a single order by ID for the logged-in customer
  Future<Map<String, dynamic>> getCustomerOrderById(int orderId) async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/orders/customer/orders/$orderId',
      );
      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching order: $e',
        'data': null,
      };
    }
  }

  // Update an order for the logged-in customer (limited fields)
  Future<Map<String, dynamic>> updateCustomerOrder(
      int orderId, Map<String, dynamic> updateData) async {
    try {
      final response = await _apiClient.request(
        method: 'PUT',
        path: '/orders/customer/orders/$orderId',
        data: updateData,
      );
      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error updating order: $e',
      };
    }
  }

  // Get all deliveries for the logged-in employee
  Future<Map<String, dynamic>> getEmployeeDeliveries() async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/deliveries/employee/my-deliveries',
      );
      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching deliveries: $e',
        'data': [],
      };
    }
  }

  // Update a delivery for the logged-in employee
  Future<Map<String, dynamic>> updateEmployeeDelivery(
      int deliveryId, Map<String, dynamic> updateData) async {
    try {
      final response = await _apiClient.request(
        method: 'PUT',
        path: '/deliveries/employee/deliveries/$deliveryId',
        data: updateData,
      );
      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error updating delivery: $e',
      };
    }
  }

  // Get all payments for the logged-in customer
  Future<Map<String, dynamic>> getCustomerPayments() async {
    try {
      // Get all orders first, then extract payments
      final ordersResponse = await _apiClient.request(
        method: 'GET',
        path: '/orders/customer/orders',
      );

      if (!ordersResponse['success']) {
        return {
          'success': false,
          'message': ordersResponse['message'] ?? 'Failed to fetch payments',
          'data': [],
        };
      }

      final orders = ordersResponse['data'] ?? [];
      final allPayments = <dynamic>[];

      for (final order in orders) {
        final payments = order['Payments'] ?? [];
        for (final payment in payments) {
          // Add order info to payment for context
          payment['order'] = {
            'order_id': order['order_id'],
            'total_amount': order['total_amount'],
            'status': order['status'],
            'payment_status': order['payment_status'],
            'created_at': order['created_at'],
            'customer': order['customer'] ?? {},
          };
          allPayments.add(payment);
        }
      }

      return {
        'success': true,
        'data': allPayments,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching payments: $e',
        'data': [],
      };
    }
  }

  // Get a single payment by ID for the logged-in customer
  Future<Map<String, dynamic>> getCustomerPaymentById(int paymentId) async {
    try {
      // Get all payments first, then find the specific one
      final paymentsResponse = await getCustomerPayments();
      if (!paymentsResponse['success']) {
        return paymentsResponse;
      }

      final payments = paymentsResponse['data'] ?? [];
      final payment = payments.firstWhere(
        (p) => p['payment_id'] == paymentId,
        orElse: () => null,
      );

      if (payment == null) {
        return {
          'success': false,
          'message': 'Payment not found',
          'data': null,
        };
      }

      return {
        'success': true,
        'data': payment,
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching payment: $e',
        'data': null,
      };
    }
  }
}
