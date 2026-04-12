'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ClipboardList,
  Dumbbell,
  Gift,
  LayoutDashboard,
  NotebookPen,
  Target,
  Users,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const items: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Alunos', icon: Users },
  { href: '/plans', label: 'Planos', icon: ClipboardList },
  { href: '/rewards', label: 'Prêmios', icon: Gift },
  { href: '/challenges', label: 'Desafios', icon: Target },
  { href: '/workouts', label: 'Fichas', icon: Dumbbell },
  { href: '/assessments', label: 'Avaliação', icon: NotebookPen },
  { href: '/notifications', label: 'Notificações', icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
      <div className="h-16 border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900">GymForce Admin</h2>
      </div>
      <nav className="space-y-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
