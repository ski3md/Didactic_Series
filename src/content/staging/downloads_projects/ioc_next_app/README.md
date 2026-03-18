# ioc-next-app staging summary

Source: `/Users/skim4/Downloads/ioc-next-app`

This project is an IOC teaching app. The useful educational content is concentrated in JSON files under `ioc-modal-complete-upgrade/data/`.

## Identified candidates

- `lectures`: `ioc-modal-complete-upgrade/data/overview/*.json`  
- `tutorials`: `ioc-modal-complete-upgrade/data/entity/*.json`
- `algorithms`: none found
- `images`: none found

## Notes

- `data/service-lines.json` acts as the navigation/index layer for the content.
- `components/IOCModalApp.js` and `ioc-modal-complete-upgrade/server.js` show how the content is surfaced.
- The repo does not contain a separate lecture or image library outside those JSON payloads.

## Recommendation

Migrate the JSON content first. The React and Express code can stay as scaffolding unless you specifically want to port the IOC viewer itself.
