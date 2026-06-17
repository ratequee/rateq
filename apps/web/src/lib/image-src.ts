export function isRemoteImageSrc(src: string): boolean {
  return /^https?:\/\//i.test(src);
}
