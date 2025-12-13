'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import {
    LogOut,
    Menu,
    ChevronDown,
    Settings,
    Building2,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    Bell,
    User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types/auth';

// Types
interface DashboardHeaderProps {
    user: User | null;
    userInitials: string;
    isScrolled: boolean;
    isSidebarCollapsed: boolean;
    isMobileSidebarOpen: boolean;
    isUserMenuOpen: boolean;
    onToggleMobileSidebar: () => void;
    onToggleSidebar: () => void;
    onOpenSearch: () => void;
    onUserMenuChange: (open: boolean) => void;
    onLogout: () => void;
}

interface UserMenuProps {
    user: User | null;
    userInitials: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onLogout: () => void;
}

// UserMenu Component
const UserMenu = memo(function UserMenu({
    user,
    userInitials,
    isOpen,
    onOpenChange,
    onLogout,
}: UserMenuProps) {
    const handleLogout = useCallback(() => {
        onOpenChange(false);
        onLogout();
    }, [onOpenChange, onLogout]);

    return (
        <Popover open={isOpen} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-slate-200 dark:ring-slate-700">
                        <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold">
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>
                    <ChevronDown
                        className={cn(
                            'hidden sm:block h-4 w-4 text-slate-400 transition-transform duration-200',
                            isOpen && 'rotate-180'
                        )}
                    />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
                {/* User Info */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.avatar ?? undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                {user?.name || 'Kullanıcı'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {user?.email || ''}
                            </p>
                        </div>
                    </div>
                    {user?.role && (
                        <Badge variant="secondary" className="mt-3 text-xs">
                            {user.role}
                        </Badge>
                    )}
                </div>

                {/* Menu Items */}
                <div className="p-2">
                    <Link
                        href="/ayarlar/profil"
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <UserIcon className="h-4 w-4" />
                        Profilim
                    </Link>
                    <Link
                        href="/ayarlar"
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Settings className="h-4 w-4" />
                        Ayarlar
                    </Link>
                    <Separator className="my-2" />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
});

// DashboardHeader Component
export const DashboardHeader = memo(function DashboardHeader({
    user,
    userInitials,
    isScrolled,
    isSidebarCollapsed,
    isMobileSidebarOpen: _isMobileSidebarOpen,
    isUserMenuOpen,
    onToggleMobileSidebar,
    onToggleSidebar,
    onOpenSearch,
    onUserMenuChange,
    onLogout,
}: DashboardHeaderProps) {
    return (
        <header
            className={cn(
                'sticky top-0 z-50 h-16 bg-white dark:bg-slate-900 border-b transition-all duration-200',
                isScrolled ? 'border-slate-200 dark:border-slate-800 shadow-sm' : 'border-transparent'
            )}
        >
            <div className="flex h-full items-center justify-between px-4 lg:px-6">
                {/* Left Section */}
                <div className="flex items-center gap-3">
                    {/* Mobile Menu */}
                    <button
                        className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        onClick={onToggleMobileSidebar}
                        aria-label="Menüyü aç"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Desktop Sidebar Toggle */}
                    <button
                        className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        onClick={onToggleSidebar}
                        aria-label={isSidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
                    >
                        {isSidebarCollapsed ? (
                            <PanelLeftOpen className="h-5 w-5" />
                        ) : (
                            <PanelLeftClose className="h-5 w-5" />
                        )}
                    </button>

                    {/* Logo */}
                    <Link href="/genel" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="hidden md:block text-lg font-semibold text-slate-800 dark:text-white">
                            Dernek Yönetim
                        </span>
                    </Link>
                </div>

                {/* Search Bar - Desktop */}
                <div className="hidden lg:flex flex-1 max-w-md mx-8">
                    <button
                        onClick={onOpenSearch}
                        className={cn(
                            'w-full h-10 px-4 flex items-center gap-3 rounded-lg border transition-all',
                            'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                            'text-slate-500 dark:text-slate-400 text-sm',
                            'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        )}
                    >
                        <Search className="h-4 w-4" />
                        <span className="flex-1 text-left">Hızlı arama...</span>
                        <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded">
                            ⌘K
                        </kbd>
                    </button>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                    {/* Mobile Search */}
                    <button
                        onClick={onOpenSearch}
                        className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Search className="h-5 w-5" />
                    </button>

                    {/* Notifications */}
                    <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* User Menu */}
                    <UserMenu
                        user={user}
                        userInitials={userInitials}
                        isOpen={isUserMenuOpen}
                        onOpenChange={onUserMenuChange}
                        onLogout={onLogout}
                    />
                </div>
            </div>
        </header>
    );
});
