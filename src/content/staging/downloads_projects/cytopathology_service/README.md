# cytopathology-service staging summary

Source: `/Users/skim4/Downloads/cytopathology-service`

The project is a React cytopathology review app. The only migratable educational content I found is embedded inside `src/CytopathologyService.js`, which holds the case bank, diagnostic criteria, specimen mappings, management rules, and references.

No standalone lecture or algorithm files were found.

Image assets are limited to app branding:
- `public/favicon.ico`
- `public/logo192.png`
- `public/logo512.png`
- `src/logo.svg`

Recommendation: extract the embedded case/tutorial data into structured content before any larger migration step.
