import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Overview', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" stroke="currentColor" strokeWidth="1.6"/></svg>
  )},
  { to: '/profile', label: 'Profile', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14Z" stroke="currentColor" strokeWidth="1.6"/></svg>
  )},
  { to: '/health-plan', label: 'Plans', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
  )},
  { to: '/mho/test', label: 'Planner Test', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
  )},
  { to: '/about', label: 'About', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 6a6 6 0 1 1-6 6 6 6 0 0 1 6-6Zm-.8 3.4h1.6V18h-1.6V9.4Zm.8-3.9a.95.95 0 1 0 .001 1.9A.95.95 0 0 0 12 5.5Z" stroke="currentColor" strokeWidth="1.4"/></svg>
  )},
]

export default function SideNav() {
  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <div className="card p-4 sticky top-24">
        <div className="text-xs uppercase tracking-wider text-[var(--GloWell-gray)] mb-2">Navigation</div>
        <nav className="flex flex-col gap-1">
          {items.map(i => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white ${isActive ? 'text-[var(--GloWell-green)]' : 'text-[var(--GloWell-navy)]'}`
              }
            >
              <span className="opacity-80">{i.icon}</span>
              <span>{i.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
