'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { clearTokens } from '@/lib/auth';

type HeaderProps = {
  userName?: string;
  userRole?: string;
};

export function Header({ userName = 'Administrador', userRole = 'admin' }: HeaderProps) {
  const router = useRouter();

  function onLogout() {
    clearTokens();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">GymForce Admin</h1>
        <p className="text-xs text-gray-500">Painel operacional</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{userName}</p>
          <p className="text-xs uppercase text-gray-500">{userRole}</p>
        </div>
        <Button onClick={onLogout} variant="secondary">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
