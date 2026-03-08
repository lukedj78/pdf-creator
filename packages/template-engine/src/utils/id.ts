let counter = 0

export function generateId(prefix = "el"): string {
  counter++
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`
}
