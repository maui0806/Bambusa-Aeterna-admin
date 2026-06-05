/**
 * Host that reaches the machine running `firebase emulators:start`.
 *
 * Admin panel runs in a desktop/mobile browser — always use localhost unless you
 * open the app from another device on your LAN (then set VITE_FIREBASE_EMULATOR_HOST
 * to your PC's LAN IP, same as physical-device Expo).
 */
export function getEmulatorHost() {
  const override = import.meta.env.VITE_FIREBASE_EMULATOR_HOST?.trim()
  if (override) return override
  return 'localhost'
}

export function isFirebaseEmulatorsEnabled() {
  return import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
}
