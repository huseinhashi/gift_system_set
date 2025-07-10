import 'package:location/location.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  final Location _location = Location();

  Future<Map<String, dynamic>> getCurrentLocation() async {
    try {
      // Check if location service is enabled
      bool serviceEnabled = await _location.serviceEnabled();
      if (!serviceEnabled) {
        serviceEnabled = await _location.requestService();
        if (!serviceEnabled) {
          return {
            'success': false,
            'message': 'Location services are disabled',
          };
        }
      }

      // Check location permission
      PermissionStatus permissionGranted = await _location.hasPermission();
      if (permissionGranted == PermissionStatus.denied) {
        permissionGranted = await _location.requestPermission();
        if (permissionGranted != PermissionStatus.granted) {
          return {
            'success': false,
            'message': 'Location permission not granted',
          };
        }
      }

      // Get current location
      LocationData locationData = await _location.getLocation();

      return {
        'success': true,
        'data': {
          'lat': locationData.latitude,
          'lng': locationData.longitude,
        },
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Error getting location: $e',
      };
    }
  }

  Future<bool> hasLocationPermission() async {
    try {
      PermissionStatus permission = await _location.hasPermission();
      return permission == PermissionStatus.granted;
    } catch (e) {
      return false;
    }
  }

  Future<bool> requestLocationPermission() async {
    try {
      PermissionStatus permission = await _location.requestPermission();
      return permission == PermissionStatus.granted;
    } catch (e) {
      return false;
    }
  }
}
