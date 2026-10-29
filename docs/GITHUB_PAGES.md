# GitHub Pages static deployment

The Pages build exports published content and public media from Directus into the static artifact. Visitors load the generated files from GitHub Pages; the browser does not call Directus or the Nuxt API at runtime. Run the workflow again after publishing or editing content in Directus.

## Configure GitHub

1. Push this project to a GitHub repository. The workflow deploys on pushes to `main` and can also be started from **Actions → Deploy static portfolio → Run workflow**.
2. In **Settings → Pages**, choose **GitHub Actions** as the build and deployment source.
3. In **Settings → Secrets and variables → Actions → Variables**, add `DIRECTUS_URL`, such as `http://82.156.153.15:8055`. It must be reachable from GitHub-hosted runners. Do not add a Directus administrator token; the exporter uses the public read permissions.
4. For a project URL such as `https://ACCOUNT.github.io/REPOSITORY/`, leave `PAGES_BASE_PATH` unset. The workflow infers `/<repository>/`. For a user site (`ACCOUNT.github.io`) or a custom domain, set `PAGES_BASE_PATH` to `/`.
5. If using a custom domain, add the `PAGES_SITE_URL` variable (for example, `https://portfolio.example.com`). GitHub Pages still needs the domain and DNS configured in **Settings → Pages**.
6. Run the workflow. Its deployment job reports the published Pages URL.

The Directus public role must be able to read `profile`, `categories`, published `activities`, `directus_files`, and the corresponding public assets. For `directus_files`, permit the `is_public` field because it is used by the row filter, plus `id`, `filename_download`, and `type` for export. The exporter stops with an error if a referenced file is private or unavailable. Anything exported into the Pages artifact is public, so only use content and files intended for public viewing.

## Generate locally

Set `DIRECTUS_URL` and optionally `PAGES_BASE_PATH`, then run:

```powershell
$env:DIRECTUS_URL = 'http://127.0.0.1:8055'
$env:PAGES_BASE_PATH = '/'
npm run generate:static
```

The generated site is in `.output/public`. `public/static-data` and `public/static-content` are generated inputs and should not be committed. Re-run the command after Directus content changes.
