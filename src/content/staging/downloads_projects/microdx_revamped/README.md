# microdx_revamped staging summary

Source: `/Users/skim4/Downloads/microdx_revamped`

This repo is a Streamlit microbiology review app. The main educational payload is the large markdown file `ABPath_MicroDx_Clean.md`, which includes case-bank content, diagnostic algorithms, and explanation text. The app wrapper `app_revamped.py` loads that content and provides navigation plus notes.

I did not find a separate lecture bank or a dedicated image library.

Candidate files:
- `ABPath_MicroDx_Clean.md`
- `app_revamped.py`

Recommendation: keep the markdown content as the source of truth and split it into structured tutorial/algorithm content before any large-scale migration.
