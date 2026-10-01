/** Primary tab routes that should scroll the document on mobile web. */
export function isDocumentScrollPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return path === "/" || path === "/treatment" || path === "/diary";
}
