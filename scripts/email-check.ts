/**
 * Checks the Resend setup without sending any email and without printing the key.
 *
 *   pnpm email:check
 *
 * Reports whether RESEND_API_KEY is accepted, which domains are verified (when the key may list
 * them), and whether EMAIL_FROM_ADDRESS is on a verified domain.
 */
import 'dotenv/config'

type Domain = { name: string; status: string; region?: string }

async function main(): Promise<number> {
  const key = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM_ADDRESS?.trim() ?? ''
  const transport = process.env.EMAIL_TRANSPORT ?? 'console'

  if (!key) {
    console.log('✗ RESEND_API_KEY is empty in .env (see the comment above it for how to get one).')
    return 1
  }
  if (!key.startsWith('re_'))
    console.log('! RESEND_API_KEY does not start with "re_"; check you copied the whole key.')

  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${key}` },
  })
  const body = (await res.json().catch(() => ({}))) as {
    data?: Domain[]
    name?: string
    message?: string
  }

  if (res.status === 401 && body.name === 'restricted_api_key') {
    console.log('✓ Key accepted by Resend (sending-only permission, which is what the app needs).')
    console.log(
      '  This key cannot list domains; check Resend → Domains for the verification status.',
    )
  } else if (res.ok) {
    console.log('✓ Key accepted by Resend (full-access permission).')
    console.log(
      '  Tip: the app only needs "Sending access"; a sending-only key is safer for production.',
    )
    const domains = body.data ?? []
    if (domains.length === 0) console.log('  No domains added yet (Resend → Domains → Add Domain).')
    for (const d of domains)
      console.log(`  domain ${d.name}: ${d.status}${d.region ? ` (${d.region})` : ''}`)
    const fromDomain = from.split('@')[1]
    const match = domains.find((d) => d.name === fromDomain)
    if (fromDomain && !match)
      console.log(`! EMAIL_FROM_ADDRESS uses ${fromDomain}, which is not in your Resend domains.`)
    if (match && match.status !== 'verified')
      console.log(`! ${fromDomain} is "${match.status}", not verified yet.`)
    if (match?.status === 'verified')
      console.log(`✓ EMAIL_FROM_ADDRESS is on a verified domain (${fromDomain}).`)
  } else {
    console.log(
      `✗ Resend rejected the key (HTTP ${res.status}): ${body.message ?? body.name ?? 'unknown error'}`,
    )
    return 1
  }

  console.log(
    `  EMAIL_TRANSPORT is "${transport}"${transport === 'resend' ? ' (emails are really sent)' : ' (emails are printed, not sent)'}.`,
  )
  return 0
}

// Set exitCode instead of calling process.exit(): on Windows, exiting while fetch's sockets are
// closing can crash Node (libuv assertion in async.c, exit code 0xC0000409; KI-12).
main().then(
  (code) => {
    process.exitCode = code
  },
  (err: unknown) => {
    console.error('✗ Could not reach Resend:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  },
)
