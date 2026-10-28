# Cordova code push demo by HotCodePush

The demo app for [Cordova code push](https://hotcodepush.com/cordova-code-push) with `@hotcodepush/cordova-code-push`: one screen showing the bundle version, the current release, the channel, the device id and the last rollback, with buttons that sync, open the debug screen, set or clear the channel, roll back and clear the updates.

## Getting started

```sh
nvm use
npm ci
npx hotcodepush login
npm run build
npx cordova prepare
npx cordova run ios       # or: npx cordova run android
```

`npx cordova prepare` restores the platforms and the plugin from `package.json` and copies the web build into each platform.
Every native build runs the CLI's build step, which writes `hotcodepush.json` into the app; an archive or a release build also registers the store build in HotCodePush.
Without a login the file names no channel and the app takes no updates.
Set `HOTCODEPUSH_FILES_BASE_URL` and `HOTCODEPUSH_UPDATES_BASE_URL` before the native build to point it at the local stack or staging.

## Usage

Run the app once: it shows `v1` and the current release `embedded`.
Change `VERSION` in `src/main.ts`, run `npm run build`, release with `npx hotcodepush release create --path www`, and reopen the app to see the new label.

## Development

```sh
npm run dev              # Vite in the browser, where no plugin exists
npm run build            # the web bundle into www/
npm run prepare:native   # cordova prepare
npm run lint && npm run typecheck
npm run fmt              # run before every commit
```

The flows in `maestro/` are the update lifecycle contract the monorepo's `e2e/` runner drives on the simulator and the emulator; each flow's header names what it expects.
By hand: install the app, release `v2`, then `maestro test -e EXPECTED_VERSION=v2 -e EXPECTED_RELEASE_NUMBER=1 maestro/golden-path.yaml`.
`CLAUDE.md` holds the native build commands and the resource file's rules.

## Documentation

See [hotcodepush.com/docs/cordova](https://hotcodepush.com/docs/cordova).

## License

See [LICENSE](./LICENSE).
