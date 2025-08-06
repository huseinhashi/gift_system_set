// lib/main.dart
import 'package:flutter/material.dart';
import 'screens/auth/login_screen.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/product_provider.dart';
import 'screens/auth/register_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/customer/customer_dashboard.dart';
import 'screens/employee/employee_dashboard.dart';
import 'screens/customer/product_details_screen.dart';
import 'screens/customer/checkout_screen.dart';
import 'screens/customer/cart_screen.dart';
import 'utils/AppColor.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    MapboxOptions.setAccessToken(
        "pk.eyJ1IjoiaHVzZWluaGFzaGkiLCJhIjoiY205dGZnamowMGJpcTJscjZ1d3MwbW44diJ9.rPualb13tYJzXX_1vSXBGg");
    print("Mapbox token set successfully");
  } catch (e) {
    print("Error setting Mapbox token: $e");
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        // ChangeNotifierProvider(create: (_) => EmergencyProvider()),
        // ChangeNotifierProvider(create: (_) => AssignmentProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp(
            title: 'Gifts System',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: primaryColor,
                primary: primaryColor,
                secondary: secondaryColor,
                surface: surfaceColor,
                background: backgroundColor,
              ),
              useMaterial3: true,
              appBarTheme: const AppBarTheme(
                centerTitle: true,
                elevation: 0,
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/customer_dashboard': (context) =>
                  const CustomerDashboardScreen(),
              '/employee_dashboard': (context) =>
                  const EmployeeDashboardScreen(),
              '/product_details': (context) {
                final args = ModalRoute.of(context)!.settings.arguments as int;
                return ProductDetailsScreen(productId: args);
              },
              '/checkout': (context) => const CheckoutScreen(),
              '/cart': (context) => const CartScreen(),
            },
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
