/**
 * Nihongo Mock branding in the admin panel (Phase 9). Plain images from /public/brand (D-048):
 * the light or reversed lockup is chosen by the admin theme (custom.scss).
 */
export function Logo() {
  return (
    <span className="nm-admin-logo">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin graphic, fixed small SVG */}
      <img
        className="nm-admin-logo__day"
        src="/brand/nihongo-mock-logo.svg"
        alt="Nihongo Mock"
        width={300}
        height={73}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- admin graphic, fixed small SVG */}
      <img
        className="nm-admin-logo__night"
        src="/brand/nihongo-mock-logo-reversed.svg"
        alt="Nihongo Mock"
        width={300}
        height={73}
      />
    </span>
  )
}

export function Icon() {
  // eslint-disable-next-line @next/next/no-img-element -- admin graphic, fixed small SVG
  return <img src="/brand/nihongo-mock-icon.svg" alt="Nihongo Mock" width={28} height={28} />
}
