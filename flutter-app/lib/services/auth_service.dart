/// Firebase Authentication service using Riverpod.

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Provider for the authentication service.
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

/// Stream provider for the current auth state.
final authStateProvider = StreamProvider<User?>((ref) {
  return ref.read(authServiceProvider).currentUser;
});

/// Authentication service wrapping Firebase Auth.
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  // Client ID moved INSIDE the class, no duplicate global variable
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: '540870892709-bjojbn4lv62f0tk55jtfeoaleqlng5dm.apps.googleusercontent.com',
  );

  /// Stream of auth state changes.
  Stream<User?> get currentUser => _auth.authStateChanges();

  /// Whether a user is currently signed in.
  bool get isSignedIn => _auth.currentUser != null;

  /// The current Firebase user, if signed in.
  User? get user => _auth.currentUser;

  /// Sign in with Google OAuth.
  Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      final OAuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      return await _auth.signInWithCredential(credential);
    } on FirebaseAuthException catch (e) {
      throw Exception('Authentication failed: ${e.message}');
    } catch (e) {
      throw Exception('Sign in failed: $e');
    }
  }

  /// Sign out the current user.
  Future<void> signOut() async {
    await Future.wait<void>([
      _auth.signOut(),
      _googleSignIn.signOut(),
    ]);
  }
}