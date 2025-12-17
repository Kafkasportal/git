'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import {
    LogOut,
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
    isUserMenuOpen: boolean;
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
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-border">
                        <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary-700 text-primary-foreground text-xs font-semibold">
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>
                    <ChevronDown
                        className={cn(
                            'hidden sm:block h-4 w-4 text-muted-foreground transition-transform duration-200',
                            isOpen && 'rotate-180'
                        )}
                    />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
                {/* User Info */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.avatar ?? undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary-700 text-primary-foreground font-semibold">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                                {user?.name || 'Kullanıcı'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
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
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary transition-colors"
                    >
                        <UserIcon className="h-4 w-4" />
                        Profilim
                    </Link>
                    <Link
                        href="/ayarlar"
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary transition-colors"
                    >
                        <Settings className="h-4 w-4" />
                        Ayarlar
                    </Link>
                    <Separator className="my-2" />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
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
    isUserMenuOpen,
    onToggleSidebar,
    onOpenSearch,
    onUserMenuChange,
    onLogout,
}: DashboardHeaderProps) {
    return (
        <header
            className={cn(
                'sticky top-0 z-50 h-16 bg-background border-b transition-all duration-200',
                isScrolled ? 'border-border shadow-sm' : 'border-transparent'
            )}
        >
            <div className="flex h-full items-center justify-between px-4 lg:px-6">
                {/* Left Section */}
                <div className="flex items-center gap-3">
                    {/* Sidebar Toggle */}
                    <button
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-md shadow-primary/20">
                            <Building2 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="hidden md:block text-lg font-semibold text-foreground">
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
                            'bg-muted border-border',
                            'text-muted-foreground text-sm',
                            'hover:bg-secondary hover:border-border'
                        )}
                    >
                        <Search className="h-4 w-4" />
                        <span className="flex-1 text-left">Hızlı arama...</span>
                        <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium bg-background border border-border rounded">
                            ⌘K
                        </kbd>
                    </button>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                    {/* Mobile Search */}
                    <button
                        onClick={onOpenSearch}
                        className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                        <Search className="h-5 w-5" />
                    </button>

                    {/* Notifications */}
                    <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
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
