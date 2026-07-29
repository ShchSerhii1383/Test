# assets/vendor

## lottie.min.js — needs to be added by hand

The gift animations are played by **lottie-web**. The game looks for a
local copy here first and only falls back to a CDN if it's missing.

**Download this one file and save it in this folder as `lottie.min.js`:**

https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js

(It's about 250KB. Open the link, save the page as `lottie.min.js`.)

### Why local rather than the CDN

- This is a gift. It shouldn't stop working the day unpkg.com changes a
  URL, goes down, or is blocked on someone's network.
- On patchy mobile data a CDN request can simply time out, and the
  animations quietly degrade to the drawn fallback icons.
- Everything else in this project is self-contained. This is the one
  exception, and it doesn't need to be.

### How to tell if it worked

Open the browser console. If the local file is missing you'll see a
warning naming this README. If it loaded, there's no message at all.

Nothing breaks either way — a gift with no animation still shows its
hand-drawn icon, title and message.
