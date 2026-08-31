/**
 * Pre-computed blur data URLs for Next.js Image placeholder="blur".
 *
 * A tiny 1×1 base64-encoded PNG pixel gives lazy-loaded images a soft
 * tinted placeholder instead of a blank white box while loading.
 * The browser decodes it instantly (<200 bytes) and swaps to the real
 * image once loaded — no extra network request, no layout shift.
 */

/** Konkan brand green (#3A7D5C) — matches the site palette */
export const PRODUCT_BLUR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOwqo0BAAIIARR3iNKkAAAAAElFTkSuQmCC';

/** Warm cream (#f5f0eb) — matches the card background */
export const CREAM_BLUR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4+uE1AAWuAtEUGJ/AAAAAAElFTkSuQmCC';
