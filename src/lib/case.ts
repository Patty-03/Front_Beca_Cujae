export function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

export function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
}

export function toCamelObject<T extends Record<string, unknown>>(value: T): T {
  if (Array.isArray(value)) return value.map(toCamelObject) as unknown as T
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[toCamel(key)] = toCamelObject(val as Record<string, unknown>)
    }
    return result as T
  }
  return value
}

export function toSnakeObject<T extends Record<string, unknown>>(value: T): T {
  if (Array.isArray(value)) return value.map(toSnakeObject) as unknown as T
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[toSnake(key)] = toSnakeObject(val as Record<string, unknown>)
    }
    return result as T
  }
  return value
}
