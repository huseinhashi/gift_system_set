import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/product_provider.dart';
import '../../widgets/customer_app_bar.dart';
import 'package:google_fonts/google_fonts.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({Key? key}) : super(key: key);

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final productProvider = Provider.of<ProductProvider>(context);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: CustomerAppBar(
        title: 'Shopping Cart',
        showCart: false, // Don't show cart icon in cart screen
      ),
      body: cartProvider.items.isEmpty
          ? _buildEmptyCart()
          : _buildCartContent(cartProvider, productProvider, theme),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.shopping_cart_outlined,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 24),
          Text(
            'Your cart is empty',
            style: GoogleFonts.poppins(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Add some products to get started!',
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.shopping_bag),
            label: Text('Start Shopping', style: GoogleFonts.poppins()),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartContent(CartProvider cartProvider,
      ProductProvider productProvider, ThemeData theme) {
    return Column(
      children: [
        // Cart items list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: cartProvider.items.length,
            itemBuilder: (context, index) {
              final item = cartProvider.items[index];
              return _buildCartItem(item, cartProvider, productProvider, theme);
            },
          ),
        ),
        // Bottom section with total and checkout
        _buildBottomSection(cartProvider, theme),
      ],
    );
  }

  Widget _buildCartItem(CartItem item, CartProvider cartProvider,
      ProductProvider productProvider, ThemeData theme) {
    // Find the product to get stock information
    final product = productProvider.products.firstWhere(
      (p) => p.productId == item.productId,
      orElse: () => Product(
        productId: item.productId,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        stockQuantity: 0,
        imageUrl: item.imageUrl,
        isActive: true,
      ),
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Product info row
            Row(
              children: [
                // Product image
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: item.imageUrl != null
                      ? Image.network(
                          'http://localhost:2322/images/${item.imageUrl}',
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: Colors.grey[300],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child:
                                  const Icon(Icons.image, color: Colors.grey),
                            );
                          },
                        )
                      : Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.grey[300],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.image, color: Colors.grey),
                        ),
                ),
                const SizedBox(width: 16),
                // Product details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '\$${item.price.toStringAsFixed(2)}',
                        style: GoogleFonts.poppins(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Total: \$${(item.price * item.quantity).toStringAsFixed(2)}',
                        style: GoogleFonts.poppins(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                // Remove button
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => _showRemoveDialog(item, cartProvider),
                  tooltip: 'Remove item',
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Quantity controls row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Stock status
                if (item.quantity >= product.stockQuantity)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red[200]!),
                    ),
                    child: Text(
                      'Max stock: ${product.stockQuantity}',
                      style: GoogleFonts.poppins(
                        color: Colors.red,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                // Quantity controls
                Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.remove, size: 20),
                        onPressed: () {
                          cartProvider.decrementQuantity(item.productId);
                        },
                        constraints: const BoxConstraints(
                          minWidth: 40,
                          minHeight: 40,
                        ),
                        padding: EdgeInsets.zero,
                      ),
                    ),
                    Container(
                      width: 60,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        '${item.quantity}',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        color: item.quantity >= product.stockQuantity
                            ? Colors.grey[300]
                            : Colors.grey[200],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: IconButton(
                        icon: Icon(
                          Icons.add,
                          size: 20,
                          color: item.quantity >= product.stockQuantity
                              ? Colors.grey[500]
                              : Colors.black87,
                        ),
                        onPressed: item.quantity >= product.stockQuantity
                            ? null
                            : () {
                                cartProvider.incrementQuantity(item.productId);
                              },
                        constraints: const BoxConstraints(
                          minWidth: 40,
                          minHeight: 40,
                        ),
                        padding: EdgeInsets.zero,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomSection(CartProvider cartProvider, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Total amount
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total:',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                Text(
                  '\$${cartProvider.totalAmount.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    cartProvider.clearCart();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Cart cleared'),
                        backgroundColor: Colors.orange,
                      ),
                    );
                  },
                  icon: const Icon(Icons.clear_all),
                  label: Text('Clear Cart', style: GoogleFonts.poppins()),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: _canProceedToCheckout(cartProvider)
                      ? () {
                          Navigator.pushNamed(context, '/checkout');
                        }
                      : null,
                  icon: const Icon(Icons.shopping_cart_checkout),
                  label:
                      Text('Proceed to Checkout', style: GoogleFonts.poppins()),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  bool _canProceedToCheckout(CartProvider cartProvider) {
    if (cartProvider.items.isEmpty) return false;

    // Check if any item has stock issues
    final productProvider =
        Provider.of<ProductProvider>(context, listen: false);
    for (final item in cartProvider.items) {
      final product = productProvider.products.firstWhere(
        (p) => p.productId == item.productId,
        orElse: () => Product(
          productId: item.productId,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          stockQuantity: 0,
          imageUrl: item.imageUrl,
          isActive: true,
        ),
      );

      if (product.stockQuantity == 0 || item.quantity > product.stockQuantity) {
        return false;
      }
    }

    return true;
  }

  void _showRemoveDialog(CartItem item, CartProvider cartProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Remove Item',
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Text(
            'Are you sure you want to remove ${item.name} from your cart?',
            style: GoogleFonts.poppins()),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancel', style: GoogleFonts.poppins()),
          ),
          ElevatedButton(
            onPressed: () {
              cartProvider.removeItem(item.productId);
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('${item.name} removed from cart'),
                  backgroundColor: Colors.red,
                  duration: const Duration(seconds: 2),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text('Remove', style: GoogleFonts.poppins()),
          ),
        ],
      ),
    );
  }
}
