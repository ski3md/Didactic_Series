# clinical-pathology-review staging summary

Source: `/Users/skim4/Downloads/clinical-pathology-review`

This repo does not contain separate lecture or algorithm files to migrate. The useful educational content is embedded in the React app, mainly the high-yield MCQ bank in `src/App.jsx`, the duplicate generator/content script `setup-clinical-pathology-app.sh`, and the tutorial/help copy in `src/components/HelpModal.js`.

Images are limited to app branding assets only:
- `public/favicon.ico`
- `public/logo192.png`
- `public/logo512.png`
- `src/logo.svg`

Recommendation: treat this as an app-content extraction task, not a file-copy migration. Normalize the embedded review content before staging anything larger.
