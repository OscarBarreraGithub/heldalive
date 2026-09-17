# Participation in the first screen

## Shipped behavior

- A central panel shows visible browser sessions, loaded model holders, and allocated pieces still getting ready. These values come from the room snapshot. Sessions are not unique people.
- The 36-light strip shows the next incomplete model group, or the first complete group. Loading, ready and currently busy pieces have different appearances. Text reports complete groups and browser-run responses.
- On disconnect, counts become unknown rather than showing stale numbers as live.
- The previous authored phone-equivalent header is no longer rendered or added to measured participation.
- The main contribution choices are Gentle, More and Most. The header opens Settings with a labeled compute switch. Off immediately stops contribution, survives reload, and does not download model weights. Existing data-saving preferences remain respected.
- The temporary native fallback remains enabled. Neither scheduling nor inference changed. No death countdown, deletion or terminal run state was introduced.

## Verification

- Typecheck and production build passed.
- Existing responsive UI suite passed at 320, 390, 768 and 1440 pixels. The premise, participation panel, alien and Settings fit in the first phone screen. Boost choices also fit at 390×740; the smallest 320×568 screen needs a short scroll to reach them.
- Manually inspected headless screenshots at 390×740 and 1440×1000; checked 320×568 and 844×390 geometry with no horizontal overflow.
- Automated accessibility scans passed on all destinations and both dialogs at desktop and mobile sizes.
- `node scripts/test-presence.mjs` verified real local room arrivals/departures, immediate withdrawal of CPU helper tasks, saved off preference, resumption, and no model requests while off. Local display fixtures verified loading, busy and multiple-group views plus disconnect behavior. Fixtures were never published to the installation.
- The existing heavy inference scripts were updated to use the new Settings switch. They were not rerun for this presentation-only change; physical-phone performance remains an outstanding commissioning task.

Screenshots are in ignored `.local/qa/edition13/`.

## Release

Deployed to heldalive.com as Cloudflare version `fcf0e10a-b1a2-41af-ae46-296730a75808`. Live checks at 390×740, 320×568 and 844×390 confirmed the displayed sessions matched the incoming room snapshot, the alien remained on the first screen, and there was no horizontal overflow, JavaScript error or model download in watch-only mode. The Settings switch and keyboard focus restoration passed. Native fallback remained enabled with capacity one; no lifecycle or erasure operation was performed.
