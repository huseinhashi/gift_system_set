import 'package:client_app/services/api_client.dart';

class ProductService {
  final ApiClient _apiClient = ApiClient();

  // Get all products
  Future<Map<String, dynamic>> getAllProducts() async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/products',
      );
      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching products: $e',
      };
    }
  }

  // Get product by ID
  Future<Map<String, dynamic>> getProductById(int productId) async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/products/$productId',
      );
      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching product: $e',
      };
    }
  }

  // Get products by category
  Future<Map<String, dynamic>> getProductsByCategory(String category) async {
    try {
      final response = await _apiClient.request(
        method: 'GET',
        path: '/products',
        queryParameters: {'category': category},
      );
      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error fetching products by category: $e',
      };
    }
  }
}
