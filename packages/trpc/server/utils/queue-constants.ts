const PROTECTED_QUEUE_NAMES = new Set(["root", "default"]);

export function isProtectedQueue(name: string): boolean {
    return PROTECTED_QUEUE_NAMES.has(name.toLowerCase());
}

export function protectedQueueDeleteMessage(name: string): string {
    return `The '${name}' queue is a system queue and cannot be deleted.`;
}
