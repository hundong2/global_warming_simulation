# GitHub Pages deployment

**English** | [한국어](ko/deployment.md) · [Documentation](../README.md#documentation)

## Current delivery

The repository includes a complete static application and deployment workflow. Creating these files does not activate Pages or publish the site. Check the latest development log for actual remote deployment status. The expected URL after successful publication is [Climate Lab on GitHub Pages](https://hundong2.github.io/global_warming_simulation/).

## Local preview

```sh
npm ci
npm run dev
npm run check
npx playwright install chromium
npm run test:e2e
npm run preview
```

The dev server normally opens at `http://127.0.0.1:5173`; preview normally uses port 4173. `npm run test:e2e` builds and checks the repository subpath on port 4193. Do not open `index.html` through `file://`.

## First publication

1. Review the source and verify locally. Obtain the repository owner's authorization before pushing or publishing.
2. Commit the implementation, lockfile and workflows to a branch, review it, and merge the approved change into `main`.
3. In [Settings → Pages](https://github.com/hundong2/global_warming_simulation/settings/pages), choose **GitHub Actions** under Build and deployment → Source. Do not select `docs/`; those are project documents, not the built application.
4. Ensure Settings → Actions → General permits the official actions used by the repository. Repository/organization policy or protected environments may require an administrator.
5. Open [Actions → Deploy to GitHub Pages](https://github.com/hundong2/global_warming_simulation/actions/workflows/pages.yml), select **Run workflow → main**, and run. Future pushes to `main` trigger the same workflow. Rerun after configuring Pages if an earlier attempt failed.
6. The build job runs formatting, types, unit tests, build checks and both browser projects before uploading `dist/` as a Pages artifact. Deployment requires that job to succeed and runs only from `main`.
7. Open the URL from the successful deployment. A workflow file or local preview alone is not evidence of publication.

GitHub provides `GITHUB_TOKEN`. No personal access token, API key, custom domain or paid map service is required. Verification uses `contents: read`; the deployment job has `pages: write` and `id-token: write`. Environment review requirements remain effective. Pull request validation never deploys the site.

## Subpaths and offline dependencies

Vite uses `base: './'`. Local geography is loaded through `import.meta.env.BASE_URL`; JS, CSS, icons and geography are served from the same site. The application needs no remote requests after deployment other than loading its own assets. Clicking a source link opens the external source; this is user navigation. Initial loading still needs a web server and the internet on Pages; this is not an offline-installable service worker app.

The URL hash stores settings and does not require server routing. Sharing a localhost address does not make it accessible to remote visitors; generate links from the published site.

## Troubleshooting

| Symptom                      | Check                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 404 at expected URL          | Pages source is GitHub Actions; a successful run exists; include `/global_warming_simulation/`.                 |
| Deployment permission error  | Pages enabled, Actions policy, `github-pages` environment protections, and permitted main branch.               |
| Blank globe                  | Check WebGL support and failed local asset loads. The rest of the site remains usable; use the 3D retry button. |
| Assets unavailable           | Deploy all of `dist/`, not just HTML. Do not deploy `src/` or `docs/`.                                          |
| Animation is paused          | Playback and rotation start only when explicitly selected. Hidden tabs/dialogs stop playback/rendering.         |
| Validation blocks publishing | Inspect the failed step and uploaded failure screenshots/traces; fix before retrying.                           |

Official references: [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages).
