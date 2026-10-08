# Cordova code push demo by HotCodePush

The demo app for [Cordova code push](https://hotcodepush.com/cordova-code-push) with `@hotcodepush/cordova-code-push`: one screen showing the bundle version, the current release, the device id and the last rollback, a button that syncs now and one that opens the debug screen.

## Installation

```sh
nvm use
npm ci
npm run build
npx cordova prepare
```

`npx cordova prepare` restores the platforms and the plugin from `package.json` and copies the web build into each platform; the plugin's hook adds the build step's phase to the Xcode project, and the native build writes the resource file `hotcodepush.json` into the app, an archive or a release build also creating the store build's binary; log in first with `npx hotcodepush login`, since without a token the file names no channel and the app takes no updates.
Open `platforms/ios/App.xcworkspace` in Xcode or `platforms/android` in Android Studio and run the app, or use `npx cordova run ios` and `npx cordova run android`.
Point it at another host, the local stack or staging, by setting `HOTCODEPUSH_FILES_BASE_URL` and `HOTCODEPUSH_UPDATES_BASE_URL` before the native build, `npx cordova build` or `run`, since the CLI reads them in the build step.
A release build, what a customer ships, comes as an APK with `npx cordova build android --release -- --packageType=apk`, signed through `build.json` with the debug keystore the Android Gradle plugin creates on the first debug build.

## Usage

Run the app once: it shows `v1` and the current release `embedded`.
Change `VERSION` in `src/main.ts`, run `npm run build`, release the bundle with the HotCodePush CLI, and reopen the app to see the new label.

## Documentation

The SDK reference is at [hotcodepush.com/docs/cordova](https://hotcodepush.com/docs/cordova).

## Development

```sh
npm run lint             # Prettier
npm run typecheck        # TypeScript
npm run build            # the web bundle into www/
npm run prepare:native   # cordova prepare, whose hook adds the build step's phase to the Xcode project
```

The flows in `maestro/` are the update lifecycle contract, the device test the monorepo's `e2e/` runner drives on the simulator and the emulator: `golden-path.yaml` takes a release on a fresh install, `rollback.yaml` survives a build that never signals readiness, `revoke.yaml` leaves a revoked release for the older one, `incompatible.yaml` skips a release its binary does not qualify for, `debug-screen.yaml` opens the debug screen and shares its report, which names that skip's code, `invalid-signature.yaml` shows a build that carries a public key refusing a release that is unsigned or signed with a key it does not trust, and `signed.yaml` takes a signed release on a build whose report names the public key it carries.
Each flow after the first continues where the one before left the app, except these last two, which start on the fresh builds the runner installs with a key in their configuration; the runner publishes the releases in between and passes each flow its numbers. By hand, install the app, release `v2` with the CLI, then `maestro test -e EXPECTED_VERSION=v2 -e EXPECTED_RELEASE_NUMBER=1 maestro/golden-path.yaml`, and each flow's header names what it expects.

## License

See [LICENSE](./LICENSE).
