/* Exact path data exported from the Figma frame (Phosphor CaretDown 24px,
   ArrowDown 22px, DownloadSimple 33px). Fills use currentColor so the same
   glyph can serve the enabled and disabled states. */

export function CaretDown() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.0306 9.53063L12.5306 17.0306C12.461 17.1004 12.3783 17.1557 12.2872 17.1934C12.1962 17.2312 12.0986 17.2506 12 17.2506C11.9014 17.2506 11.8038 17.2312 11.7128 17.1934C11.6217 17.1557 11.539 17.1004 11.4694 17.0306L3.96938 9.53063C3.82864 9.3899 3.74958 9.19902 3.74958 9C3.74958 8.80098 3.82864 8.61011 3.96938 8.46937C4.11011 8.32864 4.30098 8.24958 4.5 8.24958C4.69902 8.24958 4.88989 8.32864 5.03062 8.46937L12 15.4397L18.9694 8.46937C19.0391 8.39969 19.1218 8.34442 19.2128 8.3067C19.3039 8.26899 19.4015 8.24958 19.5 8.24958C19.5985 8.24958 19.6961 8.26899 19.7872 8.3067C19.8782 8.34442 19.9609 8.39969 20.0306 8.46937C20.1003 8.53906 20.1556 8.62178 20.1933 8.71283C20.231 8.80387 20.2504 8.90145 20.2504 9C20.2504 9.09855 20.231 9.19613 20.1933 9.28717C20.1556 9.37822 20.1003 9.46094 20.0306 9.53063Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** The Figma frame rotates ArrowDown 180deg; baked in here instead. */
export function ArrowUp() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <g transform="rotate(180 11 11)">
        <path
          d="M17.6739 12.8614L11.4864 19.0489C11.4226 19.1128 11.3468 19.1635 11.2633 19.1981C11.1798 19.2327 11.0904 19.2505 11 19.2505C10.9097 19.2505 10.8202 19.2327 10.7368 19.1981C10.6533 19.1635 10.5775 19.1128 10.5136 19.0489L4.32612 12.8614C4.19711 12.7324 4.12464 12.5574 4.12464 12.375C4.12464 12.1926 4.19711 12.0176 4.32612 11.8886C4.45512 11.7596 4.63009 11.6871 4.81252 11.6871C4.99496 11.6871 5.16993 11.7596 5.29893 11.8886L10.3125 16.903V3.4375C10.3125 3.25516 10.385 3.0803 10.5139 2.95136C10.6428 2.82243 10.8177 2.75 11 2.75C11.1824 2.75 11.3572 2.82243 11.4862 2.95136C11.6151 3.0803 11.6875 3.25516 11.6875 3.4375V16.903L16.7011 11.8886C16.8301 11.7596 17.0051 11.6871 17.1875 11.6871C17.37 11.6871 17.5449 11.7596 17.6739 11.8886C17.8029 12.0176 17.8754 12.1926 17.8754 12.375C17.8754 12.5574 17.8029 12.7324 17.6739 12.8614Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export function Download() {
  return (
    <svg width="33" height="33" viewBox="0 0 33 33" fill="none" aria-hidden="true">
      <path
        d="M28.875 18.5625V26.8125C28.875 27.086 28.7664 27.3483 28.573 27.5417C28.3796 27.7351 28.1173 27.8438 27.8438 27.8438H5.15625C4.88275 27.8438 4.62044 27.7351 4.42705 27.5417C4.23365 27.3483 4.125 27.086 4.125 26.8125V18.5625C4.125 18.289 4.23365 18.0267 4.42705 17.8333C4.62044 17.6399 4.88275 17.5312 5.15625 17.5312C5.42975 17.5312 5.69206 17.6399 5.88545 17.8333C6.07885 18.0267 6.1875 18.289 6.1875 18.5625V25.7812H26.8125V18.5625C26.8125 18.289 26.9211 18.0267 27.1145 17.8333C27.3079 17.6399 27.5702 17.5312 27.8438 17.5312C28.1173 17.5312 28.3796 17.6399 28.573 17.8333C28.7664 18.0267 28.875 18.289 28.875 18.5625ZM15.7704 19.2921C15.8662 19.388 15.9799 19.4641 16.1051 19.516C16.2303 19.5678 16.3645 19.5946 16.5 19.5946C16.6355 19.5946 16.7697 19.5678 16.8949 19.516C17.0201 19.4641 17.1338 19.388 17.2296 19.2921L22.3859 14.1359C22.4817 14.04 22.5577 13.9263 22.6095 13.8011C22.6614 13.6759 22.6881 13.5418 22.6881 13.4062C22.6881 13.2707 22.6614 13.1366 22.6095 13.0114C22.5577 12.8862 22.4817 12.7725 22.3859 12.6766C22.29 12.5808 22.1763 12.5048 22.0511 12.453C21.9259 12.4011 21.7918 12.3744 21.6562 12.3744C21.5207 12.3744 21.3866 12.4011 21.2614 12.453C21.1362 12.5048 21.0225 12.5808 20.9266 12.6766L17.5312 16.0733V4.125C17.5312 3.8515 17.4226 3.58919 17.2292 3.3958C17.0358 3.2024 16.7735 3.09375 16.5 3.09375C16.2265 3.09375 15.9642 3.2024 15.7708 3.3958C15.5774 3.58919 15.4688 3.8515 15.4688 4.125V16.0733L12.0734 12.6766C11.8799 12.4831 11.6174 12.3744 11.3438 12.3744C11.0701 12.3744 10.8076 12.4831 10.6141 12.6766C10.4206 12.8701 10.3119 13.1326 10.3119 13.4062C10.3119 13.6799 10.4206 13.9424 10.6141 14.1359L15.7704 19.2921Z"
        fill="currentColor"
      />
    </svg>
  )
}

/* Per-sticker actions and empty-state art. Stroked so they read at small
   sizes and inherit colour from whatever they sit on. */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function Copy() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.5" {...stroke} />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" {...stroke} />
    </svg>
  )
}

export function Trash() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v5M14 11v5" {...stroke} />
    </svg>
  )
}

export function LockOpen() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2.5" {...stroke} />
      <path d="M8 10V7a4 4 0 0 1 8 0" {...stroke} />
    </svg>
  )
}

export function LockClosed() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2.5" {...stroke} />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" {...stroke} />
    </svg>
  )
}

/** Empty-canvas hint: a hand placing something down. */
export function DropHere() {
  return (
    <svg width="60" height="60" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="6" y="8" width="22" height="22" rx="5" {...stroke} strokeDasharray="4 4" />
      <path d="M30 26l7 7m0 0l-3 .6m3-.6l-.6 3" {...stroke} />
      <circle cx="17" cy="19" r="3.5" {...stroke} />
    </svg>
  )
}

/* Tab and control glyphs. Icons carry the meaning for pre-readers; the short
   word beside them supports children who are still learning to read. */

export function Paw() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="15.5" rx="5" ry="4.2" fill="currentColor" />
      <ellipse cx="6" cy="10" rx="2.1" ry="2.7" fill="currentColor" />
      <ellipse cx="18" cy="10" rx="2.1" ry="2.7" fill="currentColor" />
      <ellipse cx="9.6" cy="6" rx="2" ry="2.5" fill="currentColor" />
      <ellipse cx="14.4" cy="6" rx="2" ry="2.5" fill="currentColor" />
    </svg>
  )
}

export function Star() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.2l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.2 6.8 19.1 8 13.3 3.6 9.3l5.9-.7L12 3.2z"
        fill="currentColor"
      />
    </svg>
  )
}

export function Palette() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.9 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .9-1.9 2-1.9h1.3A4.7 4.7 0 0 0 21 9.9C21 6 16.9 3 12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="7.6" cy="11.6" r="1.4" fill="currentColor" />
      <circle cx="10" cy="7.6" r="1.4" fill="currentColor" />
      <circle cx="15" cy="7.8" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function Wand() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19L15 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14 4.2l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z" fill="currentColor" />
      <path d="M19 12l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" fill="currentColor" />
    </svg>
  )
}

export function SoundOn() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...stroke} />
    </svg>
  )
}

export function SoundOff() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5z" fill="currentColor" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" {...stroke} />
    </svg>
  )
}

export function Sun() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.4" fill="currentColor" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" {...stroke} />
    </svg>
  )
}

export function Moon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" fill="currentColor" />
    </svg>
  )
}

/** Clear the canvas and start over. */
export function Broom() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.5 3.5L11 10" {...stroke} />
      <path d="M6 21l-2-2 4.5-4.5a3 3 0 0 1 4.2 0l1.8 1.8a3 3 0 0 1 0 4.2L14 21z" {...stroke} />
      <path d="M9.2 15.4l3.4 3.4" {...stroke} />
    </svg>
  )
}

export function Dice() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" {...stroke} />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function Mic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="2.8" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2" {...stroke} />
    </svg>
  )
}
