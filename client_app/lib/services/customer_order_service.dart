import 'package:client_app/services/api_client.dart';

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
}
