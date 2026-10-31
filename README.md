# MDNT MRKT VOX // RSS-powered podcast site

**A complete static front end + a tiny same-origin RSS relay for Netlify.**

## Identity

- Uses the user's supplied MDNT MRKT VOX style-guide artwork as a cropped, optimized website asset (no replacement of the supplied brand illustration).
- Shared identity across VOX, the reading room, journal and merchandise: Obsidian `#0A0A0A`, Bone `#F5F5F0`, Static `#4A4A4A` and Ghost `#FFFFFF`.
- Space Grotesk headlines, Inter body copy and JetBrains Mono labels. `public/brand.css` is loaded after page styles to apply the approved CONT. merchandise direction consistently.
- Supplied bird artwork, publication catalog, audio controls and feed data are preserved; page navigation and footer are shared across the four public rooms.
- Responsive desktop/mobile styling, live podcast episode index, newest-episode feature, episode search, HTML audio player, Substack links, and RSS source link.

## Merchandise preview

`/merch/` is the MDNT MRKT CONT. collection preview: five slogan studies, six proposed apparel/accessory blanks, and a separate MiiR custom-batch note. It uses the current monochrome house identity and does not accept orders. Supplier specification links are not finished-product checkout links.

See [the dated sourcing report](MERCHANDISE-RESEARCH.md) for product models, vendor comparisons, source URLs, naming rules and the remaining steps before opening orders. The page works without JavaScript or a build step.

## Podcast RSS source

`https://api.substack.com/feed/podcast/7894037.rss`

This remains the authoritative Substack podcast feed. The site does **not** generate or replace the podcast's RSS. The serverless function makes the public RSS readable to the website by fetching it from the same origin (`/api/feed`). The browser parses XML and renders public episodes; it never inserts RSS HTML directly into the page.

No API keys, API subscriptions, credentials, build tools, JavaScript dependencies, or manual episode entry needed.

## Publish it live (recommended: GitHub + Netlify)

1. Download and unzip this project.
2. Make a free GitHub repository, e.g. `mdnt-mrkt-vox`. Upload **everything inside** the unzipped folder, including `netlify.toml`, `public`, and `netlify/functions`.
3. Visit https://app.netlify.com/ → Add new project → Import an existing project → select GitHub → select the repository.
4. Netlify will read `netlify.toml`. If asked, use **Publish directory** `public`, **Functions directory** `netlify/functions`, and **no build command**.
5. Click **Deploy**. Netlify supplies a public `*.netlify.app` address. Open it and confirm episode listings and audio playback.
6. Optionally rename the Netlify site to something like `mdnt-mrkt-vox` if that name is available, or attach a domain you control under Netlify's Domain management.
7. Keep publishing episodes on Substack. The live website will automatically reflect public updates as its RSS is fetched. No site rebuild needed for episodes.

**Note:** A simple static drag-and-drop upload can display the page but will **not** deploy `netlify/functions/podcast.mjs`. Use the Git import method above for a working live feed. The public feed also must contain at least one published, public episode.

## Verify

- Open `https://YOUR-NETLIFY-SITE.netlify.app/api/feed` and confirm that it returns podcast RSS XML.
- Then open the site's home page to confirm the episode cards populate.
- Click PLAY to listen to a public episode.
- If the endpoint says unavailable, check that the feed URL is published/public and that Netlify deployed the function. You can change the fixed public URL in `netlify/functions/podcast.mjs` if Substack gives you a different public podcast RSS URL.

## Optional desktop preview

Opening `public/index.html` from disk may show the layout, but CSS and JS use root-relative URLs, so for reliable testing serve `public` on localhost. Even then, without the serverless function the RSS list remains offline by design. The fully working version requires Netlify Functions.

## Security and rights

Only the supplied public podcast RSS feed is used. Avoid putting private subscriber RSS URLs into the source code. Background artwork was derived from the brand guide supplied by the site owner. The site is a reading and listening frontend; podcast hosting, analytics, and paid-access restrictions remain with Substack.
