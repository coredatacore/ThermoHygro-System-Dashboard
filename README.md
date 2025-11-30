# ThermoHygro Dashboard

Static web dashboard for temperature and humidity data. Ready for GitHub Pages hosting.

## Quick Start (GitHub Pages)

1. Create a new GitHub repository (public) on your account.
2. In this folder, run:

   ```powershell
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
   git push -u origin main
   ```

3. Enable Pages in the repo:
   - Settings → Pages → Deploy from a branch
   - Branch: `main`, Folder: `/ (root)`
   - Save

4. Open your site:
   - `https://<YOUR_USERNAME>.github.io/<REPO_NAME>/`

## Notes

- Entry file is `index.html` (copied from `dashboard.html`).
- Uses HTTPS CDN for Chart.js and fetches data from ThingSpeak over HTTPS.
- No server code required; `.nojekyll` disables Jekyll processing.
- For Figma assets, see `design/dashboard-mock.svg` and `design/README.txt`.
