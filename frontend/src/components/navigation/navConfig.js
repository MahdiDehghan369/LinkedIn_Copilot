import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Lightbulb,
  CalendarDays,
  BarChart3,
  Bell,
  Link2,
  User,
  SlidersHorizontal,
} from 'lucide-react';

/**
 * Single source of truth for the app's navigation — pages consume this
 * via the layout, never hardcode their own nav behavior.
 */
export const NAV_SECTIONS = [
  {
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/posts', label: 'Posts', icon: FileText },
      { to: '/ideas', label: 'Ideas', icon: Lightbulb },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/linkedin', label: 'LinkedIn', icon: Link2 },
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings/ai', label: 'AI Settings', icon: SlidersHorizontal },
    ],
  },
];
