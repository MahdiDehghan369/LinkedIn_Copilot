import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Bell, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUnreadNotificationCount } from '../../hooks/useNotifications.js';
import { SidebarNav } from '../navigation/SidebarNav.jsx';
import { LinkedInStatusPill } from '../linkedin/LinkedInStatusPill.jsx';
import { Dropdown, DropdownItem } from '../ui/Dropdown.jsx';

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadNotificationCount();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-(--color-paper) lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-(--color-line) bg-(--color-paper-raised) lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-(--color-line) px-6">
          <span className="font-display text-lg font-semibold tracking-tight text-(--color-ink)">Copilot</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarNav unreadCount={unreadCount} />
        </div>
      </aside>

      {/* Mobile sidebar (slide-over) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-(--color-ink)/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-(--color-paper-raised) shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-(--color-line) px-6">
              <span className="font-display text-lg font-semibold tracking-tight text-(--color-ink)">Copilot</span>
              <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5 text-(--color-ink-soft)" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <SidebarNav unreadCount={unreadCount} onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-(--color-line) bg-(--color-paper-raised) px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-1.5 text-(--color-ink-soft) hover:bg-(--color-line)/50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display text-base font-semibold text-(--color-ink) lg:hidden">Copilot</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LinkedInStatusPill />
            </div>

            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative rounded-lg p-2 text-(--color-ink-soft) hover:bg-(--color-line)/50"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-(--color-accent)" />
              )}
            </button>

            <Dropdown
              trigger={
                <span className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 text-sm text-(--color-ink) hover:bg-(--color-line)/50">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-accent-soft) text-xs font-semibold text-(--color-accent)">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                  <span className="hidden max-w-[120px] truncate font-medium sm:inline">{user?.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-(--color-ink-faint)" />
                </span>
              }
            >
              {(close) => (
                <>
                  <DropdownItem
                    onClick={() => {
                      close();
                      navigate('/profile');
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" /> Profile
                    </span>
                  </DropdownItem>
                  <DropdownItem
                    danger
                    onClick={() => {
                      close();
                      handleLogout();
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Log out
                    </span>
                  </DropdownItem>
                </>
              )}
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
