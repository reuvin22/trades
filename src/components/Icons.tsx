type IconProps = {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export function DashboardIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </svg>
  )
}

export function JournalIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 6.5C10.5 5 8.4 4.3 4 4.5v13c4.4-.2 6.5.5 8 2 1.5-1.5 3.6-2.2 8-2v-13c-4.4-.2-6.5.5-8 2Z" />
      <path d="M12 6.5v13" />
    </svg>
  )
}

export function CalendarIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function AnalyticsIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 16v-4M12 16V8M16 16v-2" />
    </svg>
  )
}

export function CoachIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="7" width="16" height="12" rx="4" />
      <path d="M12 3v4M9 13h.01M15 13h.01M9.5 16.2c1.6.9 3.4.9 5 0" />
    </svg>
  )
}

export function BrokerIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 9.5 12 4l9 5.5M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20.5h18" />
    </svg>
  )
}

export function SettingsIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3.4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3.4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1Z" />
    </svg>
  )
}

export function SearchIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
}

export function BellIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M18 8.8a6 6 0 1 0-12 0c0 5.2-2 6.7-2 6.7h16s-2-1.5-2-6.7Z" />
      <path d="M13.7 19a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

export function ContrastIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PlusIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function TrendIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 16.5 9 10l3.5 3.5L21 5" />
      <path d="M15.5 5H21v5.5" />
    </svg>
  )
}

export function BoltIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M13 2 4.5 13.4H11l-.9 8.6L19 10.6h-6.6L13 2Z" fill="currentColor" />
    </svg>
  )
}

export function AlertIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M10.3 3.6 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3l-8.4-14.4a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17.2h.01" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}

export function ArrowUpIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

export function ArrowDownIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  )
}

export function DateRangeIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function FilterIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3.5 5.5h17l-6.6 7.6v5.6l-3.8 2.3v-7.9L3.5 5.5Z" />
    </svg>
  )
}

export function ExpectancyIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7 15.5 10.5 11l2.8 2.6L17 8.5" />
    </svg>
  )
}

export function ScalesIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 4v16M7 20h10M5 8h14M5 8 2.5 14h5L5 8Zm14 0-2.5 6h5L19 8Z" />
    </svg>
  )
}

export function ClockIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

export function CheckCircleIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.4 12.2 2.5 2.4 4.7-5" />
    </svg>
  )
}

export function XCircleIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9.4 9.4 5.2 5.2M14.6 9.4l-5.2 5.2" />
    </svg>
  )
}

export function UsersIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="9.5" cy="8.5" r="3.6" />
      <path d="M3 20c.9-3.7 3.5-5.6 6.5-5.6s5.6 1.9 6.5 5.6" />
      <path d="M16.5 5.4a3.4 3.4 0 0 1 0 6.4M18 14.9c2 .7 3.3 2.4 3.9 5.1" />
    </svg>
  )
}

export function OrgIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 21V6.5a2 2 0 0 1 1.4-1.9l6-1.9A1.4 1.4 0 0 1 13 4v17" />
      <path d="M13 10h5.6A1.4 1.4 0 0 1 20 11.4V21M2.5 21h19M7.5 8.5h2M7.5 12.5h2M7.5 16.5h2M16 14h1M16 17.5h1" />
    </svg>
  )
}

export function WalletIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 8a2 2 0 0 1 2-2h12.5a2 2 0 0 1 2 2v1" />
      <rect x="3" y="8" width="18" height="11.5" rx="2.5" />
      <path d="M16.5 13.8h1.8" />
    </svg>
  )
}

export function PlugIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 2.5v5M15 2.5v5M6.5 7.5h11v3.8a5.5 5.5 0 0 1-11 0V7.5ZM12 16.8v4.7" />
    </svg>
  )
}

export function SubscriptionIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M6.5 14.8h4" />
    </svg>
  )
}

export function ActivityIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 12.5h2.2l1.6-3.8 2.2 6.6 1.5-2.8H17" />
    </svg>
  )
}

export function AuditIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8l-5-5Z" />
      <path d="M14 3v5h5M8.5 12.5h7M8.5 16.5h4.5" />
    </svg>
  )
}

export function ChartBarsIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 20V11M9.3 20V5M14.7 20v-6.5M20 20V8" />
    </svg>
  )
}

export function CardIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19M6 14.8h3.5" />
    </svg>
  )
}

export function SnowflakeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2 3.8 16.8M12 6.2 9.6 4M12 6.2 14.4 4M12 17.8 9.6 20M12 17.8l2.4 2.2" />
    </svg>
  )
}

export function DownloadIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3.5v11M8 11l4 4 4-4M4.5 19.5h15" />
    </svg>
  )
}

export function SparkleIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  )
}

export function ShieldIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2.8 4.5 6v6c0 4.4 3.1 8.1 7.5 9.2 4.4-1.1 7.5-4.8 7.5-9.2V6L12 2.8Z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </svg>
  )
}

export function RefreshIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5" />
      <path d="M4 4.5v4h4M20 19.5v-4h-4" />
    </svg>
  )
}

export function UserPlusIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="10" cy="8.5" r="3.6" />
      <path d="M3.5 20c.9-3.7 3.4-5.6 6.5-5.6 1.2 0 2.3.3 3.2.8M17.5 14v6M14.5 17h6" />
    </svg>
  )
}

export function ArrowUpRightIcon({ size = 13, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2}>
      <path d="M7 17 17 7M8.5 7H17v8.5" />
    </svg>
  )
}

export function MonitorIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="2.5" y="4" width="19" height="13" rx="2.5" />
      <path d="M8.5 21h7M12 17v4" />
    </svg>
  )
}

export function RobotIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="7.5" width="16" height="11.5" rx="3.5" />
      <path d="M12 3.2v4.3M8.8 12.6h.01M15.2 12.6h.01M9.6 16c1.5.8 3.3.8 4.8 0" />
      <circle cx="12" cy="2.6" r="1.1" />
    </svg>
  )
}

export function UserGlyphIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="9" r="3.6" />
      <path d="M5 20c1-3.8 3.7-5.8 7-5.8s6 2 7 5.8" />
    </svg>
  )
}

export function SendIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20.5 3.5 10.8 13.2M20.5 3.5l-6.3 17-3.4-7.3-7.3-3.4 17-6.3Z" />
    </svg>
  )
}

export function SmileIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M9 10h.01M15 10h.01M8.6 14.4c1.9 1.6 4.9 1.6 6.8 0" />
    </svg>
  )
}

/** Google's mark keeps its own brand colors, so it bypasses the shared base. */
export function GoogleIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.64h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.57Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.7v2.98A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.18a6.9 6.9 0 0 1 0-4.36V6.84H1.7a11.5 11.5 0 0 0 0 10.32l3.85-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.08c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.63 15.11.5 12 .5A11.5 11.5 0 0 0 1.7 6.84l3.85 2.98C6.46 7.1 9 5.08 12 5.08Z"
      />
    </svg>
  )
}

export function SpinnerIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2.2}>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" strokeLinecap="round" />
    </svg>
  )
}

export function MailIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  )
}

export function LogoutIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14.5 3.5H18a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-3.5" />
      <path d="M10 16.5 14.5 12 10 7.5M14 12H3.5" />
    </svg>
  )
}

export function CameraIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 8.5h2.6l1.3-2.2h8.2l1.3 2.2H20a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5Z" />
      <circle cx="12" cy="14" r="3.4" />
    </svg>
  )
}

export function CheckIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2.2}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

export function ReceiptIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5.5 2.5h13v19l-2.2-1.6-2.2 1.6-2.1-1.6-2.2 1.6-2.1-1.6-2.2 1.6v-19Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}
