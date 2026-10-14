import { afterAll } from 'vitest'

/** Closes the Payload database pool after each test file so the test process can exit. */
afterAll(async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  await payload.destroy()
})
