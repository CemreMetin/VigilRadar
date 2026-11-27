/** The VigilRadar emblem: a radar aperture with four notches, a range ring, a sweep hairline and the focal dot. Same geometry as scripts/make-icons.py. */
export default function LogoMark() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden className="shrink-0">
      <circle cx="10" cy="10" r="8" stroke="#F4EFE6" strokeWidth="1.5" />
      <path d="M10 0.5V3.6M19.5 10H16.4M10 19.5V16.4M0.5 10H3.6" stroke="#F4EFE6" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="5" stroke="#9C9488" strokeWidth="1" opacity="0.45" />
      <path d="M10 10L15.2 4.8" stroke="#F4EFE6" strokeWidth="0.75" />
      <circle cx="10" cy="10" r="2.4" fill="#E05A2B" />
    </svg>
  );
}
