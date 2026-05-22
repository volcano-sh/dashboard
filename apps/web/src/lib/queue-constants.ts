/** Volcano system queues that cannot be deleted. */
export const PROTECTED_QUEUE_NAMES = ["root", "default"] as const

export function isProtectedQueue(name: string): boolean {
  return (PROTECTED_QUEUE_NAMES as readonly string[]).includes(name.toLowerCase())
}

export function protectedQueueDeleteMessage(name: string): string {
  return `The '${name}' queue is a system queue and cannot be deleted.`
}
