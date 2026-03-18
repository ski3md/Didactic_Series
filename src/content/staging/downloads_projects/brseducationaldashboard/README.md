# brseducationaldashboard migration summary

This source project is a breast-pathology / HER2 educational dashboard. The migratable content is concentrated in `public/script.js`, which bundles the curriculum, tutorial flows, case simulations, quiz content, and image-backed slide-box material.

## Findings

- `tutorials`: strong candidate in `public/script.js`
- `images`: candidate in `public/script.js` plus the standalone `public/logo.svg`
- `lectures`: no separate lecture corpus found
- `algorithms`: no separate algorithm corpus found

## Recommendation

Stage and normalize `public/script.js` first. Treat the image content as embedded or remote references until the text curriculum is mapped into the target schema.
