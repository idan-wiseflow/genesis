import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canCreateUsers } from '../lib/permissions'
import Logo from './Logo'
import Avatar from './Avatar'

const NAV_ITEMS = [
  { to: '/', label: 'בית', icon: '🏠', end: true },
  { to: '/tasks', label: 'משימות', icon: '✅' },
  { to: '/clients', label: 'לקוחות', icon: '🗂️' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navItems = canCreateUsers(profile)
    ? [...NAV_ITEMS, { to: '/users', label: 'משתמשים', icon: '👤' }]
    : NAV_ITEMS

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <Logo className="sidebar-logo" />
        <div className="sidebar-word">לוח משימות</div>
      </div>
      <div className="nav">
        {navItems.map((item) => (
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
          <Avatar name={profile?.full_name} avatarPath={profile?.avatar_url} />
          <span>{profile?.full_name ?? 'טוען...'}</span>
        </button>
      </div>
    </nav>
  )
}
