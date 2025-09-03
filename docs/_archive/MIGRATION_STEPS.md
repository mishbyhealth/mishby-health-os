# Migration Steps
1) Commit your current repo.
2) Run: `node install_universal_blueprint.mjs`
3) Review any `.new` files and merge.
4) Wire submit handler to `generateSafePlan`.
5) Add Uploads components if needed.
6) Run lint: `npm run glowell:lint:nonclinical`
7) Export a test PDF and verify disclaimer text.
