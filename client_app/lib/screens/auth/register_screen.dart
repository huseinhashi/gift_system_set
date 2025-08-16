import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _addressController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (_formKey.currentState!.validate()) {
      // Additional custom validation
      final name = _nameController.text.trim();
      final phone = _phoneController.text.trim();
      final password = _passwordController.text;
      final address = _addressController.text.trim();

      // Name validation
      if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(name)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Name can only contain letters and spaces'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      if (RegExp(r'^\d').hasMatch(name)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Name cannot start with a number'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      if (RegExp(r'^\s').hasMatch(name)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Name cannot start with a space'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      if (RegExp(r'\s$').hasMatch(name)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Name cannot end with a space'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      if (RegExp(r'\s{2,}').hasMatch(name)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Name cannot contain consecutive spaces'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Phone validation
      if (!RegExp(r'^[\d\s\-\+\(\)]+$').hasMatch(phone)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Phone can only contain numbers, spaces, hyphens, plus signs, and parentheses'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      if (phone.length < 7) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Phone number must be at least 7 characters'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      if (phone.length > 20) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Phone number cannot exceed 20 characters'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Address validation
      if (address.isNotEmpty) {
        if (address.length > 500) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Address cannot exceed 500 characters'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }

        if (RegExp(r'^\s').hasMatch(address)) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Address cannot start with a space'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }

        if (RegExp(r'\s$').hasMatch(address)) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Address cannot end with a space'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }
      }

      // Password validation
      if (!RegExp(r'^(?=.*[a-zA-Z])').hasMatch(password)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password must contain at least one letter'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      if (!RegExp(r'^(?=.*\d)').hasMatch(password)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password must contain at least one number'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      final success = await authProvider.registerCustomer(
        name,
        phone,
        password,
        address,
      );

      if (success && mounted) {
        // Show success message and navigate to customer dashboard
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Registration successful!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pushReplacementNamed(context, '/customer_dashboard');
      } else if (mounted) {
        // Show error message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.error ?? 'Registration failed'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final ColorScheme colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo & Title
                  Icon(
                    Icons.card_giftcard,
                    size: 70,
                    color: colorScheme.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Create Account',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.primary,
                    ),
                  ),
                  Text(
                    'Register as a customer to shop for gifts',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Registration Form
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          controller: _nameController,
                          decoration: InputDecoration(
                            labelText: 'Full Name',
                            prefixIcon:
                                Icon(Icons.person, color: colorScheme.primary),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z\s]')),
                          ],
                          maxLength: 100,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your name';
                            }
                            final name = value.trim();
                            if (name.length < 2) {
                              return 'Name must be at least 2 characters';
                            }
                            if (name.length > 100) {
                              return 'Name cannot exceed 100 characters';
                            }
                            if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(name)) {
                              return 'Name can only contain letters and spaces';
                            }
                            if (RegExp(r'^\d').hasMatch(name)) {
                              return 'Name cannot start with a number';
                            }
                            if (RegExp(r'^\s').hasMatch(name)) {
                              return 'Name cannot start with a space';
                            }
                            if (RegExp(r'\s$').hasMatch(name)) {
                              return 'Name cannot end with a space';
                            }
                            if (RegExp(r'\s{2,}').hasMatch(name)) {
                              return 'Name cannot contain consecutive spaces';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: InputDecoration(
                            labelText: 'Phone Number',
                            prefixIcon:
                                Icon(Icons.phone, color: colorScheme.primary),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(RegExp(r'[\d\s\-\+\(\)]')),
                          ],
                          maxLength: 20,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your phone number';
                            }
                            final phone = value.trim();
                            if (phone.length < 7) {
                              return 'Phone number must be at least 7 characters';
                            }
                            if (phone.length > 20) {
                              return 'Phone number cannot exceed 20 characters';
                            }
                            if (!RegExp(r'^[\d\s\-\+\(\)]+$').hasMatch(phone)) {
                              return 'Phone can only contain numbers, spaces, hyphens, plus signs, and parentheses';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _addressController,
                          decoration: InputDecoration(
                            labelText: 'Address',
                            prefixIcon: Icon(Icons.location_on,
                                color: colorScheme.primary),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          maxLength: 500,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your address';
                            }
                            final address = value.trim();
                            if (address.length > 500) {
                              return 'Address cannot exceed 500 characters';
                            }
                            if (RegExp(r'^\s').hasMatch(address)) {
                              return 'Address cannot start with a space';
                            }
                            if (RegExp(r'\s$').hasMatch(address)) {
                              return 'Address cannot end with a space';
                            }
                            return null;
                          },
                          maxLines: 2,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon:
                                Icon(Icons.lock, color: colorScheme.primary),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility
                                    : Icons.visibility_off,
                                color: Colors.grey,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.deny(RegExp(r'\s')),
                          ],
                          maxLength: 100,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter a password';
                            }
                            if (value.length < 6) {
                              return 'Password must be at least 6 characters';
                            }
                            if (value.length > 100) {
                              return 'Password cannot exceed 100 characters';
                            }
                            if (!RegExp(r'^(?=.*[a-zA-Z])').hasMatch(value)) {
                              return 'Password must contain at least one letter';
                            }
                            if (!RegExp(r'^(?=.*\d)').hasMatch(value)) {
                              return 'Password must contain at least one number';
                            }
                            if (RegExp(r'^\s').hasMatch(value)) {
                              return 'Password cannot start with a space';
                            }
                            if (RegExp(r'\s$').hasMatch(value)) {
                              return 'Password cannot end with a space';
                            }
                            if (RegExp(r'\s').hasMatch(value)) {
                              return 'Password cannot contain spaces';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _confirmPasswordController,
                          obscureText: _obscureConfirmPassword,
                          decoration: InputDecoration(
                            labelText: 'Confirm Password',
                            prefixIcon:
                                Icon(Icons.lock, color: colorScheme.primary),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureConfirmPassword
                                    ? Icons.visibility
                                    : Icons.visibility_off,
                                color: Colors.grey,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscureConfirmPassword =
                                      !_obscureConfirmPassword;
                                });
                              },
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.deny(RegExp(r'\s')),
                          ],
                          maxLength: 100,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please confirm your password';
                            }
                            if (value != _passwordController.text) {
                              return 'Passwords do not match';
                            }
                            return null;
                          },
                        ),

                        if (authProvider.error != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              authProvider.error!,
                              style: TextStyle(
                                color: colorScheme.error,
                                fontSize: 14,
                              ),
                            ),
                          ),

                        const SizedBox(height: 24),

                        // Register Button
                        ElevatedButton(
                          onPressed: authProvider.isLoading ? null : _register,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: colorScheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            textStyle: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          child: authProvider.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 3,
                                  ),
                                )
                              : const Text('Register'),
                        ),

                        const SizedBox(height: 24),

                        // Login Button
                        TextButton(
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          child: RichText(
                            textAlign: TextAlign.center,
                            text: TextSpan(
                              text: 'Already have an account? ',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: Colors.grey[700],
                              ),
                              children: [
                                TextSpan(
                                  text: 'Login',
                                  style: GoogleFonts.poppins(
                                    color: colorScheme.primary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
