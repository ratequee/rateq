/**
 * Font patching disabled for release/preview stability.
 *
 * The previous implementation rewrote React Native's Text/TextInput via
 * `require('react-native/Libraries/...')`, which causes a JS fatal
 * (RCTExceptionsManager → SIGABRT) on iOS 26 New Architecture release builds.
 *
 * Screens already set `fontFamily` through `getFontFamily()` / style props.
 */
export {};
