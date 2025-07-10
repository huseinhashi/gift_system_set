import 'package:client_app/services/api_client.dart';
import 'package:client_app/providers/cart_provider.dart';
import 'package:client_app/providers/auth_provider.dart';

class OrderService {
  static final ApiClient _apiClient = ApiClient();

  static Future<Map<String, dynamic>> createOrder({
    required List<CartItem> items,
    required double totalAmount,
    required String customerPhone,
    required int customerId,
    double? lat,
    double? lng,
  }) async {
    try {
      // Prepare order data
      final orderData = {
        'order': {
          'customer_id': customerId,
          'lat': lat,
          'lng': lng,
        },
        'items': items
            .map((item) => {
                  'product_id': item.productId,
                  'quantity': item.quantity,
                })
            .toList(),
      };

      // Create order with items
      final orderResponse = await _apiClient.request(
        method: 'POST',
        path: '/orders/customer/bulk',
        data: orderData,
      );

      if (!orderResponse['success']) {
        return {
          'success': false,
          'message': orderResponse['message'] ?? 'Failed to create order',
        };
      }

      final order = orderResponse['data'];
      final orderId = order['order_id'];
      // Process payment
      final paymentResponse = await processPayment(
        orderId: orderId,
        amount: totalAmount,
        customerPhone: customerPhone,
      );

      if (paymentResponse['success']) {
        // Payment successful - update order status
        final updateResult =
            await _updateOrderStatus(orderId, 'confirmed', 'paid');

        if (!updateResult['success']) {
          return {
            'success': true,
            'message':
                'Order created and payment successful, but order status update failed: ${updateResult['message']}',
            'data': {
              'order': order,
              'payment': paymentResponse,
              'updateError': updateResult['message'],
            },
          };
        }

        // Create payment record
        final paymentRecordResult = await _createPaymentRecord(
          orderId: orderId,
          amount: totalAmount,
          transactionId: paymentResponse['referenceId'],
          paymentType: 'api',
        );

        if (!paymentRecordResult['success']) {
          return {
            'success': true,
            'message':
                'Order created and payment successful, but payment record creation failed: ${paymentRecordResult['message']}',
            'data': {
              'order': order,
              'payment': paymentResponse,
              'recordError': paymentRecordResult['message'],
            },
          };
        }

        return {
          'success': true,
          'message': 'Order created and payment successful',
          'data': {
            'order': order,
            'payment': paymentResponse,
            'paymentRecord': paymentRecordResult['data'],
          },
        };
      } else {
        // Payment failed - order remains pending
        return {
          'success': true,
          'message':
              'Order created but payment failed: ${paymentResponse['message']}',
          'data': {
            'order': order,
            'payment': paymentResponse,
          },
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error creating order: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> processPayment({
    required int orderId,
    required double amount,
    required String customerPhone,
  }) async {
    try {
      final paymentData = {
        'orderId': orderId,
        'amount': amount,
        'phone': customerPhone,
      };

      final response = await _apiClient.request(
        method: 'POST',
        path: '/payments/process',
        data: paymentData,
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Payment processing failed: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> _updateOrderStatus(
    int orderId,
    String status,
    String paymentStatus,
  ) async {
    try {
      final response = await _apiClient.request(
        method: 'PUT',
        path: '/orders/customer/orders/$orderId',
        data: {
          'status': status,
          'payment_status': paymentStatus,
        },
      );

      if (!response['success']) {
        return {
          'success': false,
          'message': response['message'] ?? 'Failed to update order status',
        };
      }

      return {
        'success': true,
        'message': response['message'] ?? 'Order status updated successfully',
        'data': response['data'],
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to update order status: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> _createPaymentRecord({
    required int orderId,
    required double amount,
    required String transactionId,
    required String paymentType,
  }) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/payments',
        data: {
          'order_id': orderId,
          'payment_type': paymentType,
          'transaction_id': transactionId,
          'amount': amount,
        },
      );

      if (!response['success']) {
        return {
          'success': false,
          'message': response['message'] ?? 'Failed to create payment record',
        };
      }

      return {
        'success': true,
        'message': response['message'] ?? 'Payment record created successfully',
        'data': response['data'],
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to create payment record: ${e.toString()}',
      };
    }
  }
}
