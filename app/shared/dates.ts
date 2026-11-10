// Month dates from app/content (for example "2024-09"), shown as "Sep 2024".
// A fixed list of month names, not Intl, so the server and every browser
// write the same text and hydration never sees a difference.
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

// "2024-09" -> "Sep 2024". Throws on anything else, so a bad date fails the
// build instead of showing odd text.
export function formatMonth(value: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value)
  if (!match) throw new Error(`Not a YYYY-MM date: "${value}"`)
  return `${months[Number(match[2]) - 1]} ${match[1]}`
}
