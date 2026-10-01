const PATHS = {user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M17 4.5a3.5 3.5 0 010 7M22 20c0-3-2-4.5-4-5"/>',award:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',plus:'<path d="M12 5v14M5 12h14"/>',bell:'<path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',check:'<path d="M5 12l5 5 9-10"/>',flame:'<path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 2-4 3-6 1 1 1 2 2 2 1-2 1-5 1-8z"/>',heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z"/>',msg:'<path d="M21 12a8 8 0 01-12 7l-5 1 1.5-4.5A8 8 0 1121 12z"/>',uadd:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6M19 8v6M16 11h6"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'} as const

export type IconName = keyof typeof PATHS

export function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: PATHS[name] }} />
}
