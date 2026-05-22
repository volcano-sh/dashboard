/* eslint-disable @typescript-eslint/no-explicit-any */

function volumeHasClaim(vol: Record<string, unknown>): boolean {
  return Boolean(vol.volumeClaimName || vol.volumeClaim || vol.claim)
}

function validateVolumeList(
  volumes: unknown,
  path: string,
  messages: string[]
): void {
  if (!volumes) return
  if (!Array.isArray(volumes)) return

  volumes.forEach((vol, index) => {
    if (!vol || typeof vol !== "object") return
    const v = vol as Record<string, unknown>
    if (!v.mountPath) {
      messages.push(`${path}[${index}]: mountPath is required`)
      return
    }
    if (!volumeHasClaim(v)) {
      messages.push(
        `${path}[${index}] (mountPath: ${v.mountPath}): either volumeClaim or volumeClaimName must be specified`
      )
    }
  })
}

/** Validate Volcano Job volume constraints before calling the API. */
export function validateJobManifest(manifest: Record<string, any>): string | null {
  const messages: string[] = []
  const spec = manifest.spec

  if (!spec || typeof spec !== "object") {
    return "Job spec is required"
  }

  validateVolumeList(spec.volumes, "spec.volumes", messages)

  if (Array.isArray(spec.tasks)) {
    spec.tasks.forEach((task: any, taskIndex: number) => {
      if (task?.volumes) {
        validateVolumeList(task.volumes, `spec.tasks[${taskIndex}].volumes`, messages)
      }
    })
  }

  if (messages.length === 0) return null
  return messages[0] ?? "Invalid job volume configuration"
}
