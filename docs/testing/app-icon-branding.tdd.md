# TDD evidence — app icon branding

## Source plan

No `*.plan.md`. Journeys were derived during this TDD run from the request:
the APK installed from CI had no logo. Investigation found `mobile/assets/*`
still held Expo's stock placeholder art.

The request said to take the logo "from the internet". That was not needed —
the authentic mark already lives in the repo at `public/logo.png` and is what
the website header (`src/components/Header.tsx:20`) and hero render. Using it
avoids a wrong-mark or licensing risk from a scraped image. Recorded here
because it is a deliberate deviation from the literal instruction.

## User journeys

1. As a staff member, I want the Don Macchiatos logo on my phone's home screen,
   so that I can find the orders app at a glance among other apps.
2. As a staff member, I want the logo to look correct on my launcher, so that
   the mark is not cropped or letterboxed by my phone's icon mask.
3. As the shop owner, I want the app and the website to share one mark, so that
   the two products read as one brand.

## Task report

### Task 1 — replace the placeholder launcher, adaptive and splash icons

**Summary.** Generated all four Expo assets from `public/logo.png` via a new
repeatable script instead of hand-editing binaries.

**Validation command.** `npx jest __tests__/appIcons.test.ts`

**RED** (against the placeholder assets, commit `88aac6e`):

```
● renders the logo's black line art in the launcher icon
  Expected: > 0.015
  Received:   0
● keeps every adaptive icon pixel inside Android's 66dp safe circle
  Expected: <= 0.3055555555555556
  Received:    0.6027871089668162

Tests: 4 failed, 5 passed, 9 total
```

**GREEN** (commit `e3e0f09`):

```
Tests: 9 passed, 9 total
```

**Guaranteed.** The three shipped icons contain the brand line art, and the
Android adaptive foreground fits inside the mask-safe circle.

### Task 2 — keep the placeholder from returning

**Summary.** The contract test runs in the same `npm test` step that already
gates the APK build (`.github/workflows/android-apk.yml:62`), so a regression
fails CI before a 20-minute EAS build burns.

**Validation command.** `npm test`

```
Test Suites: 6 passed, 6 total
Tests:       83 passed, 83 total
```

**Guaranteed.** No regression in the existing 74 tests from the asset change.

## Test specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|--------------------|----------------------|-----------|--------|----------|
| 1 | The launcher icon contains the logo's black line art, not blank placeholder art | `mobile/__tests__/appIcons.test.ts:renders the logo's black line art in the launcher icon` | unit | PASS | `npx jest __tests__/appIcons.test.ts` |
| 2 | The Android adaptive icon contains the logo's line art | `mobile/__tests__/appIcons.test.ts:renders the logo's black line art in the Android adaptive icon` | unit | PASS | same |
| 3 | The splash icon contains the logo's line art | `mobile/__tests__/appIcons.test.ts:renders the logo's black line art in the splash icon` | unit | PASS | same |
| 4 | The launcher icon is 1024x1024 | `mobile/__tests__/appIcons.test.ts:ships a 1024x1024 launcher icon` | unit | PASS | same |
| 5 | The launcher icon is fully opaque, as the App Store requires | `mobile/__tests__/appIcons.test.ts:keeps the launcher icon fully opaque` | unit | PASS | same |
| 6 | The adaptive icon is 1024x1024 | `mobile/__tests__/appIcons.test.ts:ships a 1024x1024 adaptive icon` | unit | PASS | same |
| 7 | The adaptive icon keeps transparency so `android.adaptiveIcon.backgroundColor` shows through | `mobile/__tests__/appIcons.test.ts:leaves the adaptive icon transparent` | unit | PASS | same |
| 8 | No adaptive icon pixel falls outside Android's 66dp safe circle | `mobile/__tests__/appIcons.test.ts:keeps every adaptive icon pixel inside Android's 66dp safe circle` | unit | PASS | same |
| 9 | The favicon is square | `mobile/__tests__/appIcons.test.ts:ships a square favicon` | unit | PASS | same |

## Coverage and known gaps

`collectCoverageFrom` in `mobile/jest.config.js` scopes coverage to the five
pure logic modules; `scripts/generate-app-icons.js` is a build-time tool and is
deliberately outside that scope, so the 80% threshold is unaffected. The script
is nonetheless exercised end-to-end — the contract test asserts against the
files it produces.

Known gaps, all intentional:

- **Source resolution.** `public/logo.png` is 232x218, so the 1024px assets are
  upscaled ~3.7x. The pipeline re-crisps edges with an alpha contrast curve and
  the result is clean at launcher size, but a vector or high-res original would
  be strictly better. Drop one in at `public/logo.png` and run `npm run icons`.
- **No visual regression test.** The tests assert geometry and ink coverage, not
  that the mark *looks* right. Rendered output was inspected manually instead.
- **iOS unverified on device.** Only the Android APK is built by CI.

## Merge evidence

- RED — `88aac6e` `test: add contract test for branded app icon assets`;
  4 of 9 failing against the placeholder assets.
- GREEN — `e3e0f09` `feat: use the Don Macchiatos logo for the app icon and splash`;
  9 of 9 passing, full suite 83 passing.
- No separate refactor commit: the generator was written in its final shape,
  with one correction folded in before the GREEN commit (flattening the
  launcher icon's alpha channel after Jimp's blend left edge pixels at 254).
