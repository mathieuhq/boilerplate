export function isSafeNotificationLink(link: string) {
  return link.startsWith("/") && !link.startsWith("//") && !link.includes("\\");
}
