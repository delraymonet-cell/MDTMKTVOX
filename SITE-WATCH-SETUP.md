# MDNT MRKT VOX: automated two-hour website watch

GitHub Actions workflow: `.github/workflows/site-watch.yml`

- Schedule: every two hours at 17 minutes past the even UTC hour. GitHub cron is best-effort and can be delayed or occasionally skipped.
- Manual run: GitHub > Actions > "MDNT MRKT VOX two-hour site watch" > Run workflow.
- Test targets: homepage, publication library, publication catalog, private analytics dashboard, JavaScript files, security headers, authenticated analytics endpoint (must reject anonymous requests), and malformed analytics events (must reject them).
- Reports: Actions > workflow run > artifact `site-watch-report`; failures automatically create/update a GitHub issue and recovery closes it.
- The workflow retries transient network errors but does **not** perform intrusive penetration tests or exploit attempts. A periodic external check cannot prove the website is secure.

## Optional, limited automatic recovery

If the public homepage, library, or dashboard is unavailable and no existing health-alert issue is open, the workflow can request **one Netlify rebuild**. This only works after you configure a Netlify build hook, stored in GitHub Actions as a secret named `NETLIFY_BUILD_HOOK_URL`.

1. Netlify > Project configuration > Build & deploy > Build hooks. Create a hook for `main`, if available.
2. GitHub > Repository Settings > Secrets and variables > Actions > New repository secret.
3. Name it `NETLIFY_BUILD_HOOK_URL` and paste the private Netlify build-hook URL. Never commit or share the URL publicly.
4. The first incident with a failed essential route requests one rebuild and creates an issue. Further scans update the issue, **not** repeatedly trigger deploys. The issue closes after recovery; a later new incident may initiate another rebuild.

The limited recovery cannot repair bad Linkjar/PDFLink URLs, broken application code, expired accounts, compromised credentials, or vulnerabilities. Those require review. Do not configure self-modifying source-code patches based solely on scanner output.

## Visibility

GitHub: https://github.com/delraymonet-cell/MDTMKTVOX/actions

Netlify: https://app.netlify.com/projects/mdntmrktvox/deploys
