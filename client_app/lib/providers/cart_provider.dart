import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class CartItem {
  final int productId;
  final String name;
  final String description;
  final double price;
  final String? imageUrl;
  final String category;
  int quantity;

  CartItem({
    required this.productId,
    required this.name,
    required this.description,
    required this.price,
    this.imageUrl,
    required this.category,
    required this.quantity,
  });

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'name': name,
      'description': description,
      'price': price,
      'imageUrl': imageUrl,
      'category': category,
      'quantity': quantity,
    };
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      productId: json['productId'],
      name: json['name'],
      description: json['description'],
      price: json['price'].toDouble(),
      imageUrl: json['imageUrl'],
      category: json['category'],
      quantity: json['quantity'],
    );
  }

  double get totalPrice => price * quantity;
}

class CartProvider extends ChangeNotifier {
  List<CartItem> _items = [];
  bool _isLoading = false;

  List<CartItem> get items => _items;
  bool get isLoading => _isLoading;
  int get itemCount => _items.length;
  int get totalQuantity => _items.fold(0, (sum, item) => sum + item.quantity);
  double get totalAmount =>
      _items.fold(0, (sum, item) => sum + item.totalPrice);

  CartProvider() {
    _loadCart();
  }

  Future<void> _loadCart() async {
    try {
      _setLoading(true);
      final prefs = await SharedPreferences.getInstance();
      final cartData = prefs.getString('cart');
      if (cartData != null) {
        final List<dynamic> cartList = jsonDecode(cartData);
        _items = cartList.map((item) => CartItem.fromJson(item)).toList();
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error loading cart: $e');
      }
    } finally {
      _setLoading(false);
    }
  }

  Future<void> _saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartData = jsonEncode(_items.map((item) => item.toJson()).toList());
      await prefs.setString('cart', cartData);
    } catch (e) {
      if (kDebugMode) {
        print('Error saving cart: $e');
      }
    }
  }

  void addItem({
    required int productId,
    required String name,
    required String description,
    required double price,
    String? imageUrl,
    required String category,
    int quantity = 1,
  }) {
    final existingIndex =
        _items.indexWhere((item) => item.productId == productId);

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(
        productId: productId,
        name: name,
        description: description,
        price: price,
        imageUrl: imageUrl,
        category: category,
        quantity: quantity,
      ));
    }

    _saveCart();
    notifyListeners();
  }

  void updateQuantity(int productId, int quantity) {
    final index = _items.indexWhere((item) => item.productId == productId);
    if (index >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      _saveCart();
      notifyListeners();
    }
  }

  void incrementQuantity(int productId) {
    final index = _items.indexWhere((item) => item.productId == productId);
    if (index >= 0) {
      _items[index].quantity += 1;
      _saveCart();
      notifyListeners();
    }
  }

  void decrementQuantity(int productId) {
    final index = _items.indexWhere((item) => item.productId == productId);
    if (index >= 0) {
      if (_items[index].quantity <= 1) {
        // Remove item if quantity would become 0
        _items.removeAt(index);
      } else {
        _items[index].quantity -= 1;
      }
      _saveCart();
      notifyListeners();
    }
  }

  void removeItem(int productId) {
    _items.removeWhere((item) => item.productId == productId);
    _saveCart();
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    _saveCart();
    notifyListeners();
  }

  CartItem? getItem(int productId) {
    try {
      return _items.firstWhere((item) => item.productId == productId);
    } catch (e) {
      return null;
    }
  }

  bool isInCart(int productId) {
    return _items.any((item) => item.productId == productId);
  }

  bool canIncrementQuantity(int productId, int maxStock) {
    final item = getItem(productId);
    if (item == null) return false;
    return item.quantity < maxStock;
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }
}
