/* services-v2/storage/uploadService.v2.ts */
export async function uploadFileV2(file: File, dest: string){ return { path: dest }; }
export async function deleteFileV2(_path: string){ /* delete */ }
export async function getSignedUrlV2(path: string){ return path; }