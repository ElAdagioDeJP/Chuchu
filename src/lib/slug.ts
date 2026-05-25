export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
}

export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
) {
  let slug = slugify(base) || 'empresa'
  if (!(await exists(slug))) return slug

  for (let i = 0; i < 5; i += 1) {
    const next = `${slug}-${Math.random().toString(36).slice(2, 6)}`
    if (!(await exists(next))) return next
  }
  return `${slug}-${Date.now().toString(36).slice(-5)}`
}
