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
        // Payment successful - backend already handled order status and payment record
        return {
          'success': true,
          'message': 'Order created and payment successful',
          'data': {
            'order': order,
            'payment': paymentResponse,
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
}
