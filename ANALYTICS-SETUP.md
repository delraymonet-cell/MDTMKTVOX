# MDNT MRKT CONT. readership analytics

This addition creates an authenticated reporting endpoint, a first-party interaction collector, and a dashboard at /admin/analytics/. It **does not** expose raw IP addresses or claim access to the third-party Linkjar/PDFLink readership metrics.

## Before merging/deployment
1. Netlify > Project configuration > Environment variables: create `ANALYTICS_ADMIN_TOKEN` using a long random string of at least 24 characters, available to Functions at runtime. **Do not commit the token to GitHub.**
2. Merge the reviewed PR into main, let Netlify deploy, confirm its function build and Blob storage are provisioned.
3. Open https://mdntmrktvox.netlify.app/admin/analytics/ and paste that private token.
4. To get Netlify's own server-side unique visitors, top pages and location reports, separately enable **Analytics & metrics > Analytics** after reviewing pricing. This application does not activate the billing feature.

## Coverage
Website page views, library visits, outbound publication opens, anonymous return-visitor signals, genre crossover, co-clicked titles, podcast play-button clicks, referral hostnames and approximate geo via Netlify Function context.geo. These are interaction counts, **not** verified Linkjar page-depth/reading-completion stats. Netlify Functions may not provide city in all environments. Demographic age and language metrics display as unavailable until a consented source is configured. IP threat detection belongs in Netlify security tooling, not a publicly reachable endpoint.

## Privacy and limitations
- DNT/GPC signals are respected; users may opt out with `localStorage.setItem('mdnt_analytics_optout','1')`.
- Site creates a random first-party browser token with a 30-day rotation and a new session token per page load. These identifiers are not user accounts and do not establish real identities.
- Events are stored in a site-wide Netlify Blobs store. There is no automatic retention deletion: establish a retention policy or scheduled purge before collecting long-term data. The report filters the last 30 days and caps analysis at 6,000 entries. This implementation suits low traffic and is not a scalable warehouse.
- Referrer hostnames, not full URLs, are stored. No raw IP addresses, precise coordinates or cross-site third-party cookies.
- Dashboard HTML is public but contains no reporting data; analytics-report function requires `ANALYTICS_ADMIN_TOKEN` with constant-time comparison. Never put secrets in browser source or GitHub.
- Include analytics use in the site's privacy notice before deployment and verify consent requirements for your audiences.
- The report's 'literary curiosity' uses publication clicks / page views as an **event ratio**, not unique visitor conversion.
- 'Bookseller intent' is unavailable until the site has a bookseller landing page and tracked inquiries.
