import 'server-only'

import { createHash } from 'node:crypto'

const IP_HEADERS = [
  'x-forwarded-for',
  'x-real-ip',
  'cf-connecting-ip',
  'x-vercel-forwarded-for',
  'x-client-ip',
]

function normalizeIp(raw: string): string {
  const first = raw.split(',')[0]?.trim() ?? ''
  if (!first) return ''

  // IPv4 with port: 1.2.3.4:1234
  const ipv4WithPort = first.match(/^(\d+\.\d+\.\d+\.\d+):\d+$/)
  if (ipv4WithPort) return ipv4WithPort[1]

  return first
}

export function getClientIp(headers: Headers): string | null {
  for (const headerName of IP_HEADERS) {
    const value = headers.get(headerName)
    if (!value) continue
    const ip = normalizeIp(value)
    if (ip) return ip
  }
  return null
}

export function hashClientIp(ip: string): string {
  const salt = process.env.TRIAL_IP_SALT ?? 'chuchu-trial-ip'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}
