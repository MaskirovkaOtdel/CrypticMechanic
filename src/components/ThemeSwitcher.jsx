import { Monitor, Flame, Cpu, MonitorX, Sun } from 'lucide-react';

const themes = [
  { id: 'midnight-terminal', label: 'Midnight Terminal', icon: Monitor },
  { id: 'kernel-panic', label: 'Kernel Panic', icon: Flame },
  { id: 'circuit-board', label: 'Circuit Board', icon: Cpu },
  { id: 'blue-screen', label: 'Blue Screen', icon: MonitorX },
  { id: 'clean-room', label: 'Clean Room', icon: Sun },
];

export default function ThemeSwitcher({ currentTheme, onThemeChange }) {
  return (
    <div className="setting-group">
      <label>Theme</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {themes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onThemeChange(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: currentTheme === id ? '1px solid var(--accent)' : '1px solid transparent',
              background: currentTheme === id ? 'var(--accent-subtle)' : 'transparent',
              color: currentTheme === id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              fontWeight: currentTheme === id ? 600 : 400,
              transition: 'all 0.2s ease',
              textAlign: 'left',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
