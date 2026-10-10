import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from './navConfig.js';

/**
 * @param {{ unreadCount?: number, onNavigate?: () => void }} props
 */
export function SidebarNav({ unreadCount = 0, onNavigate }) {
  return (
    <nav className="flex flex-col gap-6">
      {NAV_SECTIONS.map((section, index) => (
        <div key={section.label ?? index}>
          {section.label && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-(--color-ink-faint)">
              {section.label}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-(--color-accent-soft) text-(--color-accent)'
                      : 'text-(--color-ink-soft) hover:bg-(--color-line)/50 hover:text-(--color-ink)'
                  }`
                }
              >
                <span className="flex items-center gap-2.5">
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  {item.label}
                </span>
                {item.to === '/notifications' && unreadCount > 0 && (
                  <span className="rounded-full bg-(--color-accent) px-1.5 py-0.5 text-[10px] font-semibold text-(--color-accent-ink)">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
