# MDNT MRKT CONT. — website expansion
## Three rooms, one Netlify site

- **Podcast:** `/`, powered by the original podcast RSS `https://api.substack.com/feed/podcast/7894037.rss`.
- **Newsletter:** `/newsletter/`, powered by `https://mdntmrktcont.substack.com/feed` through `/api/newsletter` (Netlify function `netlify/functions/newsletter.mjs`).
- **PDF Library:** `/library/`, a searchable curated directory of Linkjar publication landing pages.

The newsletter is a **public RSS index only**. It does not unlock paid posts. To change the visibility of an article you own, use Substack's individual post publication/audience settings and publish the update. Avoid exposing access tokens, subscriber-specific RSS URLs, or paid article bodies in the source code.

## How to make changes live
1. Open GitHub: https://github.com/delraymonet-cell/MDTMKTVOX
2. Confirm the new files are visible on `main`:
   - `public/newsletter/index.html`
   - `public/library/index.html`
   - `netlify/functions/newsletter.mjs`
   - `public/index.html` (three-section nav)
   - `netlify.toml` (newsletter proxy route)
3. Netlify: open the project connected to **this exact repo** (not `MDT-MKT-VOX`).
4. Confirm deploy settings: `main` branch, empty base directory, empty build command, publish `public`, functions `netlify/functions`.
5. Under Deploys, check the latest production deploy is Published. If not, trigger Deploy latest commit / Retry deploy.
6. Check: `/newsletter/`, `/library/`, and `/api/newsletter` on your Netlify domain.
7. `/api/newsletter` should return public RSS XML. If not, check function logs and whether your public Substack RSS is accessible.

## Updating the Linkjar library
- Open `public/library/index.html` in GitHub.
- Find the JavaScript array starting with `const books=`.
- Add a new entry as `["Title","Genre","https://linkjar.to/your-link/","Short description"]`.
- Commit to `main`. Netlify should automatically publish it.
- This is a directory of **Linkjar destinations**, not an attempt to download or bypass a locked PDF.

## Common errors
- If the homepage works but `/newsletter/` is 404, verify the build publishes the repository's **public/** directory and that Netlify built the latest commit.
- If `/api/newsletter` is 404, check `netlify.toml` and function deployment.
- If the feed returns 502, verify that the public Substack feed responds and the serverless function can fetch it.
- If there are no newsletter cards but XML exists, validate that Substack provides RSS `item` elements.
- If the library shows a card but Linkjar reports missing, fix that URL in the books array; do not make up replacement links.

**House identity:** Obsidian #0A0A0A, Bone #F5F5F0, Chartreuse #D8EF57, Oxide #E48667, River #A9D0C5.
