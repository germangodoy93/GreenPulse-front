import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/devices', label: 'Dispositivos', icon: '⬡' },
  { to: '/alerts', label: 'Alertas', icon: '🔔' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const clearToken = useAuthStore((s) => s.clearToken);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const sidebar = (
    <aside
      className="w-64 flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, #0d2c1c 0%, #0a2417 100%)' }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: '#3fae3a' }}
          >
            G
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">GreenPulse</div>
            <div className="text-xs" style={{ color: '#8fd14b' }}>IoT Monitor</div>
          </div>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="md:hidden text-white/50 hover:text-white p-1 rounded transition"
          aria-label="Cerrar menú"
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <span className="text-base w-5 text-center">↩</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: static sidebar */}
      <div className="hidden md:flex md:w-64 md:shrink-0 md:min-h-screen">
        {sidebar}
      </div>

      {/* Mobile: overlay drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative z-50 w-64 min-h-screen flex flex-col">
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
