import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

/** Locale-aware Link, redirect and router (always use these instead of next/link in pages). */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
