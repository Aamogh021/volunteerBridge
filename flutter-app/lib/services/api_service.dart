/// API service for communicating with the VolunteerBridge backend.

import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../models/community_need.dart';
import '../utils/constants.dart';

/// Provider for the API service.
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

/// HTTP client for the VolunteerBridge backend API.
class ApiService {
  final String _baseUrl = apiBaseUrl;
  final http.Client _client = http.Client();

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
      };

  /// Fetch all community needs for an organization.
  Future<List<CommunityNeed>> getMatchedTasks(String orgId) async {
    try {
      final response = await _client
          .get(
            Uri.parse('$_baseUrl/needs/$orgId'),
            headers: _headers,
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body) as List;
        return jsonList
            .map((item) =>
                CommunityNeed.fromJson(item as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception(
          'Failed to fetch tasks: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Network error fetching tasks: $e');
    }
  }

  /// Accept (assign) a task to a volunteer.
  Future<bool> acceptTask(
    String needId,
    String volunteerId,
    String orgId,
  ) async {
    try {
      final response = await _client
          .post(
            Uri.parse('$_baseUrl/assign'),
            headers: _headers,
            body: json.encode({
              'need_id': needId,
              'volunteer_id': volunteerId,
              'org_id': orgId,
            }),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        return data['success'] as bool? ?? false;
      } else {
        throw Exception(
          'Failed to accept task: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      throw Exception('Network error accepting task: $e');
    }
  }

  /// Update volunteer location directly in Firestore.
  Future<void> updateLocation(
    String volunteerId,
    double lat,
    double lng,
    String orgId,
  ) async {
    try {
      await FirebaseFirestore.instance
          .collection('organizations')
          .doc(orgId)
          .collection('volunteers')
          .doc(volunteerId)
          .update({
        'location': {
          'lat': lat,
          'lng': lng,
          'zone': 'Updated',
        },
      });
    } catch (e) {
      throw Exception('Failed to update location: $e');
    }
  }

  /// Dispose the HTTP client.
  void dispose() {
    _client.close();
  }
}
