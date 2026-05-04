export function isSessionExpiredHtml(html: string): boolean {
  return html.includes("window.top.location.href") && html.includes("/portal");
}
