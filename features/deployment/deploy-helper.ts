// features/deployment/deploy-helper.ts

import { NETLIFY_REDIRECTS } from './netlify-config';
import fs from 'fs';

export const writeNetlifyRedirects = () => {
  fs.writeFileSync('public/_redirects', NETLIFY_REDIRECTS.trim());
};
