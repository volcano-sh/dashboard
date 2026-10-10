/** Volcano system queues that cannot be deleted. */
export const PROTECTED_QUEUE_NAMES = ["root", "default"] as const

export function isProtectedQueue(name?: string | null): boolean {
  if (!name || typeof name !== "string") {
    return false
  }
  return (PROTECTED_QUEUE_NAMES as readonly string[]).includes(name.trim().toLowerCase())
}

export function protectedQueueDeleteMessage(name?: string | null): string {
  const queueName = typeof name === "string" ? name.trim() : ""
  return `The '${queueName}' queue is a system queue and cannot be deleted.`
}
