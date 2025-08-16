import 'api_client.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';

class OrderService {
  static final ApiClient _apiClient = ApiClient();

  /// Creates an order and processes payment in a single transaction
  /// If payment fails, the order is automatically rolled back and stock is restored
  static Future<Map<String, dynamic>> createOrder({
    required List<CartItem> items,
    required double totalAmount,
    required String customerPhone,
    required int customerId,
    double? lat,
    double? lng,
  }) async {
    try {
      // Prepare order data with payment information
      final orderData = {
        'order': {'customer_id': customerId, 'lat': lat, 'lng': lng},
        'items': items
            .map(
              (item) => {
                'product_id': item.productId,
                'quantity': item.quantity,
              },
            )
            .toList(),
        'payment': {'phone': customerPhone, 'amount': totalAmount},
      };

      // Create order with payment processing in a single transaction
      final response = await _apiClient.request(
        method: 'POST',
        path: '/orders/customer/bulk/payment',
        data: orderData,
      );

      if (response['success']) {
        // Order created and payment successful
        return {
          'success': true,
          'message':
              response['message'] ?? 'Order created and payment successful',
          'data': {'order': response['data']},
        };
      } else {
        // Payment failed - order was not created (rolled back)
        return {
          'success': false,
          'message':
              response['message'] ?? 'Payment failed and order was not created',
          'data': {'order': null},
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error creating order: ${e.toString()}',
      };
    }
  }
}
