// lib/services/auth_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:client_app/services/api_client.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  final ApiClient _apiClient = ApiClient();

  // Auth state change notifier
  final ValueNotifier<bool> authStateChanges = ValueNotifier<bool>(false);

  // Store user data directly
  Map<String, dynamic>? _userData;
  String? _token;
  String? _userType; // 'employee' or 'customer'

  // Getters
  Map<String, dynamic>? get userData => _userData;
  String? get token => _token;
  String? get userType => _userType;
  bool get isAuthenticated => _token != null;
  bool get isEmployee => _userType == 'employee';
  bool get isCustomer => _userType == 'customer';

  // Singleton factory
  factory AuthService() => _instance;

  AuthService._internal();

  // Initialize the service by loading saved data
  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('token');
      _userType = prefs.getString('userType');

      // Parse stored user data if available
      final userDataString = prefs.getString('userData');
      if (userDataString != null) {
        _userData = jsonDecode(userDataString) as Map<String, dynamic>;
      }

      if (_token != null) {
        _apiClient.setToken(_token!);
      }

      // Notify listeners about auth state
      authStateChanges.value = isAuthenticated;
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing auth service: $e');
      }
      rethrow;
    }
  }

  // Employee Registration
  Future<Map<String, dynamic>> registerEmployee(
    String name,
    String phone,
    String password,
  ) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/employee/register',
        data: {
          'name': name,
          'phone': phone,
          'password_hash': password,
          'role': 'employee',
        },
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during registration: $e',
      };
    }
  }

  // Customer Registration
  Future<Map<String, dynamic>> registerCustomer(
    String name,
    String phone,
    String password,
    String address,
  ) async {
    try {
      final Map<String, dynamic> data = {
        'name': name,
        'phone': phone,
        'password_hash': password,
        'address': address,
      };

      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/customer/register',
        data: data,
      );

      // If registration is successful and data contains auth token, handle as login
      if (response['success'] &&
          response['data'] != null &&
          response['data']['token'] != null) {
        await _handleLoginSuccess(response['data'], 'customer');
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during registration: $e',
      };
    }
  }

  // Employee Login
  Future<Map<String, dynamic>> loginEmployee(
      String phone, String password) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/employee/login',
        data: {
          'phone': phone,
          'password': password,
        },
      );

      if (response['success']) {
        await _handleLoginSuccess(response['data'], 'employee');
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during employee login: $e',
      };
    }
  }

  // Customer Login
  Future<Map<String, dynamic>> loginCustomer(
      String phone, String password) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/customer/login',
        data: {
          'phone': phone,
          'password': password,
        },
      );

      if (response['success']) {
        await _handleLoginSuccess(response['data'], 'customer');
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during customer login: $e',
      };
    }
  }

  // Handle successful login
  Future<void> _handleLoginSuccess(
      Map<String, dynamic> data, String userType) async {
    _token = data['token'];
    _userType = userType;

    // Store user data based on user type
    if (userType == 'employee') {
      _userData = data['employee'] as Map<String, dynamic>;
    } else {
      _userData = data['customer'] as Map<String, dynamic>;
    }

    // Set token in API client with Bearer prefix
    _apiClient.setToken(_token!);

    // Save to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);
    await prefs.setString('userType', _userType!);

    // Save user data as well
    if (_userData != null) {
      await prefs.setString('userData', jsonEncode(_userData));
    }

    // Notify listeners
    authStateChanges.value = true;
  }

  // Logout
  Future<Map<String, dynamic>> logout() async {
    try {
      // Clear data
      _token = null;
      _userData = null;
      _userType = null;

      // Clear token in API client
      _apiClient.clearToken();

      // Clear SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('userData');
      await prefs.remove('userType');

      // Notify listeners
      authStateChanges.value = false;

      return {
        'success': true,
        'message': 'Logged out successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during logout: $e',
      };
    }
  }

  // Update profile
  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? phone,
    String? address,
    String? currentPassword,
    String? newPassword,
  }) async {
    try {
      final Map<String, dynamic> data = {};
      if (name != null) data['name'] = name;
      if (phone != null) data['phone'] = phone;
      if (address != null) data['address'] = address;
      if (currentPassword != null) data['current_password'] = currentPassword;
      if (newPassword != null) data['new_password'] = newPassword;

      final endpoint = isEmployee ? '/employees/profile' : '/customers/profile';

      final response = await _apiClient.request(
        method: 'PUT',
        path: endpoint,
        data: data,
      );

      // Update local user data if successful
      if (response['success'] && response['data'] != null) {
        _userData = response['data'] as Map<String, dynamic>;
        // Save updated user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('userData', jsonEncode(_userData));
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error updating profile: $e',
      };
    }
  }
}
