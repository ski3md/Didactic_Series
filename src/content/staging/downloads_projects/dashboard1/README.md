# dashboard1 migration summary

This source is an educational CP dashboard. The core content is in five backend JSON datasets covering hematology, coagulation, chemistry, transfusion, and immunology.

## Findings

- `tutorials`: candidate found in the five `backend/data/*.json` files
- `algorithms`: none found
- `lectures`: none found
- `images`: none found

## Recommendation

Migrate the backend JSON datasets first. The frontend components are presentation layers that consume those datasets and do not appear to contain separate curriculum content.
