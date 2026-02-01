import { Outlet, Link, useLocation } from 'react-router-dom'
import './App.css'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/payment', label: 'Payment' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'cards', label: 'Cards' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'help', label: 'Help' },
  { id: 'settings', label: 'Settings' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">DurianBank</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false
            const className = `sidebar-item ${isActive ? 'active' : ''}`
            if (item.path) {
              return (
                <Link key={item.path} to={item.path} className={className}>
                  <span className="sidebar-icon" aria-hidden>{item.label[0]}</span>
                  {item.label}
                </Link>
              )
            }
            return (
              <button key={item.id} type="button" className={className}>
                <span className="sidebar-icon" aria-hidden>{item.label[0]}</span>
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>
      <Outlet />
    </div>
  )
}
