// A complete local JDK 17 is required; automatic JDK downloads are unnecessary.
// Remove the optional Foojay resolver, whose older API is incompatible with Gradle 9.
const fs = require('node:fs');
const path = require('node:path');
const target = path.join(__dirname, '..', 'node_modules', '@react-native', 'gradle-plugin', 'settings.gradle.kts');
const source = fs.readFileSync(target, 'utf8');
const resolver = /plugins\s*\{\s*id\("org\.gradle\.toolchains\.foojay-resolver-convention"\)\.version\("[^"\n]+"\)\s*\}/;
if (resolver.test(source)) fs.writeFileSync(target, source.replace(resolver, ''));
// Safe-area's build script can request AGP 9, while RN 0.82 uses AGP 8.12.
// Keep its native runtime version and align only the Android build tool.
const safeAreaBuild = path.join(__dirname, '..', 'node_modules', 'react-native-safe-area-context', 'android', 'build.gradle');
const safeAreaSource = fs.readFileSync(safeAreaBuild, 'utf8');
fs.writeFileSync(safeAreaBuild, safeAreaSource.replace(/classpath\("com\.android\.tools\.build:gradle:[^"]+"\)/g, 'classpath("com.android.tools.build:gradle:8.12.0")'));
