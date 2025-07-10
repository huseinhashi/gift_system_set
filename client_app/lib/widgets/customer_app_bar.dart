import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:client_app/providers/cart_provider.dart';
import 'package:client_app/providers/auth_provider.dart';
import 'package:client_app/providers/product_provider.dart';
import 'package:google_fonts/google_fonts.dart';

class CustomerAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool showCart;

  const CustomerAppBar({
    Key? key,
    required this.title,
    this.actions,
    this.showCart = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final productProvider = Provider.of<ProductProvider>(context);
    final theme = Theme.of(context);

    // Determine if we should show back button based on current route
    final bool shouldShowBackButton = _shouldShowBackButton(context);

    return AppBar(
      automaticallyImplyLeading: shouldShowBackButton,
      title: Row(
        children: [
          Image.asset(
            'assets/logo.png',
            height: 32,
            width: 32,
            errorBuilder: (context, error, stackTrace) {
              return Icon(
                Icons.card_giftcard,
                color: Colors.white,
                size: 28,
              );
            },
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
        ],
      ),
      backgroundColor: theme.colorScheme.primary,
      elevation: 0,
      iconTheme: const IconThemeData(color: Colors.white),
      actions: [
        if (showCart)
          Stack(
            children: [
              Container(
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: IconButton(
                  icon: const Icon(Icons.shopping_cart, size: 24),
                  onPressed: () => _showCartDialog(context),
                  tooltip: 'Shopping Cart',
                ),
              ),
              if (cartProvider.totalQuantity > 0)
                Positioned(
                  right: 12,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 20,
                      minHeight: 20,
                    ),
                    child: Text(
                      '${cartProvider.totalQuantity}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        Container(
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: PopupMenuButton<String>(
            icon: const Icon(Icons.person, size: 24),
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
        ),
        if (actions != null) ...actions!,
      ],
    );
  }

  void _showCartDialog(BuildContext context) {
    Navigator.pushNamed(context, '/cart');
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Icon(
              Icons.logout,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(width: 8),
            Text(
              'Logout',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
            ),
          ],
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

  bool _shouldShowBackButton(BuildContext context) {
    // Get the current route name
    final String? currentRoute = ModalRoute.of(context)?.settings.name;

    // Don't show back button for customer dashboard and its tabs
    if (currentRoute == '/customer_dashboard') {
      return false;
    }

    // Show back button for other screens like cart, checkout, product details, etc.
    return true;
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
