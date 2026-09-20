
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      default:
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'YOUR_FIREBASE_API_KEY',
    appId: '1:540870892709:web:e34d39fe98e59c1e24414c',
    messagingSenderId: '540870892709',
    projectId: 'volunteerbridge-52687',
    authDomain: 'volunteerbridge-52687.firebaseapp.com',
    storageBucket: 'volunteerbridge-52687.firebasestorage.app',
    measurementId: 'G-LQ1SPXPCKP',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'YOUR_FIREBASE_API_KEY',
    appId: '1:540870892709:android:e57840881003620524414c',
    messagingSenderId: '540870892709',
    projectId: 'volunteerbridge-52687',
    storageBucket: 'volunteerbridge-52687.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'YOUR_FIREBASE_API_KEY',
    appId: '1:540870892709:ios:75d12c73497cdb1924414c',
    messagingSenderId: '540870892709',
    projectId: 'volunteerbridge-52687',
    storageBucket: 'volunteerbridge-52687.firebasestorage.app',
    iosBundleId: 'com.volunteerbridge.app',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'YOUR_FIREBASE_API_KEY',
    appId: '1:540870892709:ios:75d12c73497cdb1924414c',
    messagingSenderId: '540870892709',
    projectId: 'volunteerbridge-52687',
    storageBucket: 'volunteerbridge-52687.firebasestorage.app',
    iosBundleId: 'com.volunteerbridge.app',
  );
}