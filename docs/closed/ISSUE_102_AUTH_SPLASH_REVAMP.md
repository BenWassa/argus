# Issue #102 — HAUS-style Argus auth + splash revamp

**Status:** Completed and closed with GitHub issue #102.

**Closeout:** The unified auth/splash surface, reduced-motion behavior, media
fallbacks, auth gate and production validation were shipped to `main` and
deployed to Firebase Hosting. Retained here as the historical implementation
contract and acceptance record.

## Product decision

Argus uses one unified opening/authentication surface. The former standalone first-visit splash followed by a separate sign-in screen is superseded.

The visual/interaction reference is the current HAUS sign-in composition: a centered bounded shell with media above and authentication content below. Argus retains its own dark gunmetal/steel design tokens, typography, copy, Firebase behavior, and learning-product identity.

## Invariants

- Configured production never mounts learner surfaces before authentication restoration/sign-in resolves.
- Restoring sessions show status only, never a duplicate sign-in action.
- Failed sign-in remains outside learner UI and is recoverable.
- Unconfigured/local-only builds remain intentionally ungated.
- Splash media is presentation only; media readiness/failure cannot block authentication.
- Reduced-motion users receive a stable poster state without autoplay.
- The old `argus-splash-seen` lifecycle is retired with the standalone splash.

## Acceptance

- One responsive card contains the Argus splash media and auth content.
- `splashv1.mp4` autoplays muted/inline under normal motion, with `splash-poster.jpg` as fallback and a held final frame on completion.
- Google CTA includes the Google mark, duplicate-submit protection, focus treatment, and clear error handling.
- Auth gate tests prove learning surfaces do not mount before identity is known and no longer depend on the obsolete splash lifecycle.
- Validate mobile/Pixel sizing, safe areas, keyboard/focus, reduced motion, media failure, and desktop layout.
- Full repository check passes before merge.
