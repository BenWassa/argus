# Apple Home Screen Google sign-in investigation

**Status:** Investigation recorded 2026-10-17; remediation and physical-device verification outstanding.
**Authority:** Source and public production-artifact findings. The reported iPhone/iPad Home Screen failure has not been reproduced on a physical device. This is not a verified root-cause closeout or a shipped behavior contract.

## Report and findings

The owner reports that tapping Google sign-in in the iPhone/iPad Home Screen app does not navigate anywhere.

1. Both [sync](../../src/services/sync/firebaseSyncBackend.ts) and [inbox](../../src/services/inbox/firebaseInboxBackend.ts) use `signInWithPopup` exclusively. Each awaits dynamically imported Firebase modules, including Firestore, before requesting the popup. There is no redirect path or blocked-popup fallback. The asynchronous work can outlive Safari's user activation, and popup handling in the installed app is the leading explanation for the symptom. Neither mechanism has been directly measured on the affected device.
2. The public production entry `/assets/index-Cu0HHL6g.js` contains `signInWithPopup`. The production site is `argus-b7a5a.web.app`; its public `/__/firebase/init.json` and local build configuration use `argus-b7a5a.firebaseapp.com` for `authDomain`. Merely replacing popup with redirect would leave a cross-origin storage dependency. Firebase requires a compatible hosting/domain configuration for redirect sign-in in Safari.
3. The [service worker](../../scripts/serviceWorker.ts) intercepts every same-origin GET navigation and serves cached `/index.html`. The deployed `/sw.js` has the same navigation branch and no `/__/auth` exclusion. Moving auth onto the app domain without excluding Firebase reserved endpoints would allow the worker to replace auth-handler navigations with the Argus shell. This is a blocker for that proposed fix, not evidence that the current cross-origin popup is intercepted.
4. [Session startup](../../src/services/sync/useSync.ts) observes Firebase only after this device has previously signed in or the current sign-in button was pressed. The persisted marker is written after `backend.signIn()` completes. A redirect flow must explicitly resume authentication after navigation on a first-time device, and surface `getRedirectResult` errors; neither exists today.
5. [Browser tests](../../playwright.config.ts) run Chromium at several viewport sizes with Firebase configuration removed. They cannot validate Google OAuth or iOS Home Screen behavior. Existing gate tests cover injected backend behavior rather than real Firebase navigation.

## Coordinated remediation

- Use a redirect flow for the affected installed/mobile context, retaining the desktop popup flow where appropriate. Apply the same policy to sync and inbox.
- Use an app-origin Firebase auth helper on Firebase Hosting. Confirm the app domain is authorized and register `https://argus-b7a5a.web.app/__/auth/handler` in the Google OAuth client's redirect URIs before switching `authDomain`. These remote settings were not inspected or changed in this investigation.
- Bypass shell caching for Firebase reserved `/__/` endpoints before the navigation fallback. Verify a controlled app can navigate to a fixture auth handler without receiving cached app HTML.
- Record a pending redirect before leaving, resume Firebase observation on return even for first-time sign-in, consume the redirect result once, and surface failures. A pending marker must never count as authenticated or open the gate itself.
- Test first-time sign-in, cancellation, rejected/offline sign-in, returning sessions and account isolation. Verify on a physical iPhone/iPad Home Screen installation, then check Safari and desktop sign-in for regressions.

No application code, production settings or deployments were changed during this investigation. Do not claim the reported issue fixed until the device flow is verified.

## Sources

- [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin): recommends redirect on mobile.
- [Firebase redirect best practices](https://firebase.google.com/docs/auth/web/redirect-best-practices): Safari storage restrictions, same-domain auth helper configuration, and required OAuth redirect URI setup.
