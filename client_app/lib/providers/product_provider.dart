import 'package:flutter/foundation.dart';
import 'package:client_app/services/product_service.dart';

class Product {
  final int productId;
  final String name;
  final String description;
  final double price;
  final String? imageUrl;
  final String category;
  final int stockQuantity;
  final bool isActive;

  Product({
    required this.productId,
    required this.name,
    required this.description,
    required this.price,
    this.imageUrl,
    required this.category,
    required this.stockQuantity,
    required this.isActive,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      productId: json['product_id'],
      name: json['name'],
      description: json['description'] ?? '',
      price: double.parse(json['price'].toString()),
      imageUrl: json['image_url'],
      category: json['category'],
      stockQuantity: json['stock_quantity'] ?? 0,
      isActive: json['is_active'] ?? true,
    );
  }
}

class ProductProvider extends ChangeNotifier {
  final ProductService _productService = ProductService();

  List<Product> _products = [];
  Product? _selectedProduct;
  bool _isLoading = false;
  String? _error;

  List<Product> get products => _products;
  Product? get selectedProduct => _selectedProduct;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Get all products
  Future<void> fetchProducts() async {
    try {
      _setLoading(true);
      _clearError();

      final response = await _productService.getAllProducts();

      if (response['success']) {
        final List<dynamic> productsData = response['data'];
        _products = productsData.map((json) => Product.fromJson(json)).toList();
      } else {
        _setError(response['message']);
      }
    } catch (e) {
      _setError('Failed to fetch products: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Get product by ID
  Future<void> fetchProductById(int productId) async {
    try {
      _setLoading(true);
      _clearError();

      final response = await _productService.getProductById(productId);

      if (response['success']) {
        _selectedProduct = Product.fromJson(response['data']);
      } else {
        _setError(response['message']);
      }
    } catch (e) {
      _setError('Failed to fetch product: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Get products by category
  Future<void> fetchProductsByCategory(String category) async {
    try {
      _setLoading(true);
      _clearError();

      final response = await _productService.getProductsByCategory(category);

      if (response['success']) {
        final List<dynamic> productsData = response['data'];
        _products = productsData.map((json) => Product.fromJson(json)).toList();
      } else {
        _setError(response['message']);
      }
    } catch (e) {
      _setError('Failed to fetch products by category: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Get products by category name
  List<Product> getProductsByCategory(String category) {
    return _products.where((product) => product.category == category).toList();
  }

  // Get available categories
  List<String> get categories {
    return _products.map((product) => product.category).toSet().toList();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }
}
