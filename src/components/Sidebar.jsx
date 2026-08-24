import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const NAV_ITEMS = [
  { to: '/', label: 'בית', icon: '🏠', end: true },
  { to: '/tasks', label: 'משימות', icon: '✅' },
  { to: '/clients', label: 'לקוחות', icon: '🗂️' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <Logo className="sidebar-logo" />
        <div className="sidebar-word">לוח משימות</div>
      </div>
      <div className="nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="ic">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="sidebar-bottom">
        <NavLink to="/settings" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="ic">⚙️</span>
          <span>הגדרות</span>
        </NavLink>
        <button className="sidebar-user" onClick={signOut} type="button">
          <span className="avatar">{(profile?.full_name || '?').slice(0, 2)}</span>
          <span>{profile?.full_name ?? 'טוען...'}</span>
        </button>
      </div>
    </nav>
  )
}
