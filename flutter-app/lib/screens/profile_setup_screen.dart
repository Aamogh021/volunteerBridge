/// Profile setup screen with multi-step form including location.

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/firestore_service.dart';
import '../services/location_service.dart';
import '../utils/constants.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  int _currentStep = 0;
  final _nameController = TextEditingController();
  final Set<String> _selectedSkills = {};
  bool _isAvailable = true;
  String _transportType = 'Car';
  bool _saving = false;
  double? _lat;
  double? _lng;
  bool _locationLoading = false;
  bool _locationGranted = false;
  static const int _totalSteps = 4;

  @override
  void initState() {
    super.initState();
    final user = FirebaseAuth.instance.currentUser;
    _nameController.text = user?.displayName ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _requestLocation() async {
    setState(() => _locationLoading = true);
    try {
      final locationService = ref.read(locationServiceProvider);
      final position = await locationService.getCurrentPosition();
      if (position != null && mounted) {
        setState(() {
          _lat = position.latitude;
          _lng = position.longitude;
          _locationGranted = true;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Location error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _locationLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _saving = true);

    try {
      final firestoreService = ref.read(firestoreServiceProvider);
      await firestoreService.setVolunteer(
        user.uid,
        defaultOrgId,
        {
          'name': _nameController.text.trim(),
          'skills': _selectedSkills.toList(),
          'skill_description': _selectedSkills.join(', '),
          'location': {
            'lat': _lat ?? 0.0,
            'lng': _lng ?? 0.0,
            'zone': _locationGranted ? 'GPS Located' : 'Not set',
          },
          'availability': _isAvailable,
          'transport_type': _transportType,
          'completion_rate': 1.0,
          'avg_response_minutes': 10.0,
          'tasks_completed': 0,
        },
      );

      if (mounted) {
        context.go('/tasks');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save profile: $e'),
            backgroundColor: urgencyHighColor,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile Setup'),
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          // Step indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Row(
              children: List.generate(_totalSteps, (index) {
                final isActive = index <= _currentStep;
                final isCompleted = index < _currentStep;
                return Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: isActive
                              ? brandPrimary
                              : const Color(0xFFF3F4F6),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: isCompleted
                              ? const Icon(Icons.check,
                                  size: 16, color: Colors.white)
                              : Text(
                                  '${index + 1}',
                                  style: TextStyle(
                                    color: isActive
                                        ? Colors.white
                                        : const Color(0xFF9CA3AF),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                        ),
                      ),
                      if (index < _totalSteps - 1)
                        Expanded(
                          child: Container(
                            height: 2,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            color: index < _currentStep
                                ? brandPrimary
                                : const Color(0xFFE5E7EB),
                          ),
                        ),
                    ],
                  ),
                );
              }),
            ),
          ),

          // Step content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: _buildStepContent(),
            ),
          ),

          // Navigation buttons
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  if (_currentStep > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => setState(() => _currentStep--),
                        child: const Text('Back'),
                      ),
                    ),
                  if (_currentStep > 0) const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _handleNext,
                      child: _saving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(_currentStep == _totalSteps - 1
                              ? 'Complete Setup'
                              : 'Next'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildNameStep();
      case 1:
        return _buildSkillsStep();
      case 2:
        return _buildAvailabilityStep();
      case 3:
        return _buildLocationStep();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildNameStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Confirm Your Name',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'This is how coordinators will identify you during deployments.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF6B7280),
              ),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(
            labelText: 'Full Name',
            prefixIcon: Icon(Icons.person_outline),
          ),
          textCapitalization: TextCapitalization.words,
        ),
      ],
    );
  }

  Widget _buildSkillsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Select Your Skills',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'Choose all skills that apply. Our AI uses these to match you with the right crisis tasks.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF6B7280),
              ),
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: availableSkills.map((skill) {
            final selected = _selectedSkills.contains(skill);
            return FilterChip(
              label: Text(skill),
              selected: selected,
              onSelected: (value) {
                setState(() {
                  if (value) {
                    _selectedSkills.add(skill);
                  } else {
                    _selectedSkills.remove(skill);
                  }
                });
              },
              selectedColor: brandPrimary.withValues(alpha: 0.15),
              checkmarkColor: brandPrimary,
            );
          }).toList(),
        ),
        if (_selectedSkills.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(
            '${_selectedSkills.length} skill${_selectedSkills.length > 1 ? 's' : ''} selected',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: accentTeal,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ],
    );
  }

  Widget _buildAvailabilityStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Availability & Transport',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'Let us know how you can respond to emergencies.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF6B7280),
              ),
        ),
        const SizedBox(height: 24),

        // Availability toggle
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Available for tasks',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'You can change this anytime',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                Switch(
                  value: _isAvailable,
                  onChanged: (value) => setState(() => _isAvailable = value),
                  activeColor: accentTeal,
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        // Transport type
        Text(
          'Transport Type',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: transportTypes.map((type) {
            final selected = _transportType == type;
            return ChoiceChip(
              label: Text(type),
              selected: selected,
              onSelected: (value) {
                if (value) setState(() => _transportType = type);
              },
              selectedColor: brandPrimary.withValues(alpha: 0.15),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildLocationStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Enable Location',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'We need your location to match you with nearby crisis tasks. Your location is only shared with coordinators during active assignments.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF6B7280),
              ),
        ),
        const SizedBox(height: 32),

        // Location card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Icon(
                  _locationGranted
                      ? Icons.location_on
                      : Icons.location_off_outlined,
                  size: 48,
                  color: _locationGranted ? accentTeal : const Color(0xFF9CA3AF),
                ),
                const SizedBox(height: 16),
                Text(
                  _locationGranted
                      ? 'Location Captured'
                      : 'Location Not Set',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  _locationGranted
                      ? '${_lat?.toStringAsFixed(4)}, ${_lng?.toStringAsFixed(4)}'
                      : 'Tap the button below to share your location',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _locationLoading ? null : _requestLocation,
                    icon: _locationLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Icon(
                            _locationGranted ? Icons.refresh : Icons.my_location,
                          ),
                    label: Text(
                      _locationLoading
                          ? 'Locating...'
                          : _locationGranted
                              ? 'Update Location'
                              : 'Share My Location',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _locationGranted ? accentTeal : brandPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        if (!_locationGranted) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: urgencyMediumColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: urgencyMediumColor.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline,
                    size: 18, color: urgencyMediumColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'You can skip this step, but you won\'t appear in proximity-based matching.',
                    style: TextStyle(
                      fontSize: 13,
                      color: urgencyMediumColor.withValues(alpha: 0.9),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  void _handleNext() {
    if (_currentStep == 0 && _nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your name')),
      );
      return;
    }

    if (_currentStep == 1 && _selectedSkills.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one skill')),
      );
      return;
    }

    if (_currentStep < _totalSteps - 1) {
      setState(() => _currentStep++);
    } else {
      _saveProfile();
    }
  }
}
