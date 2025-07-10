// lib/main.dart
import 'package:flutter/material.dart';
import 'package:client_app/screens/auth/login_screen.dart';
import 'package:provider/provider.dart';
import 'package:client_app/providers/auth_provider.dart';
import 'package:client_app/providers/emergency_provider.dart';
import 'package:client_app/providers/assignment_provider.dart';
import 'package:client_app/providers/cart_provider.dart';
import 'package:client_app/providers/product_provider.dart';
import 'package:client_app/screens/auth/register_screen.dart';
import 'package:client_app/screens/splash_screen.dart';
import 'package:client_app/screens/customer/customer_dashboard.dart';
import 'package:client_app/screens/employee/employee_dashboard.dart';
import 'package:client_app/screens/customer/product_details_screen.dart';
import 'package:client_app/screens/customer/checkout_screen.dart';
import 'package:client_app/screens/customer/customer_orders_screen.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // // Initialize Mapbox with your access token
  // try {
  //   MapboxOptions.setAccessToken(
  //       "pk.eyJ1IjoiaHVzZWluaGFzaGkiLCJhIjoiY205dGZnamowMGJpcTJscjZ1d3MwbW44diJ9.rPualb13tYJzXX_1vSXBGg");
  //   print("Mapbox token set successfully");
  // } catch (e) {
  //   print("Error setting Mapbox token: $e");
  // }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => EmergencyProvider()),
        ChangeNotifierProvider(create: (_) => AssignmentProvider()),
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
                seedColor: const Color(0xFF6366F1),
                primary: const Color(0xFF6366F1),
                secondary: const Color(0xFF14B8A6),
                surface: Colors.white,
                background: const Color(0xFFF8FAFC),
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
              '/customer_orders': (context) => const CustomerOrdersScreen(),
            },
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
