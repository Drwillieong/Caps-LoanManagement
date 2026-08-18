import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import LogoutConfirmationModal from '@/components/modals/LogoutConfirmationModal';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/user-password';
import { type User } from '@/types';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();

    // ✅ FIX: Add state for modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // ✅ FIX: Proper logout handler
    const handleLogoutConfirm = () => {
        router.flushAll();
        router.post(logout().url);
    };

    const handleLogoutClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowLogoutModal(true);
    };

    return (
        <>
            {/* USER INFO */}
            <DropdownMenuLabel className="p-2 text-sidebar-foreground/90">
                <UserInfo user={user} showEmail />
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-[color:var(--sidebar-divider)]" />

            {/* SETTINGS */}
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                        className="
                            flex items-center
                            w-full rounded-md
                            px-2 py-1.5
                            text-sidebar-foreground
                            hover:bg-sidebar-accent
                            focus:bg-sidebar-accent
                            transition-colors
                        "
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-[color:var(--sidebar-divider)]" />

            {/* LOGOUT */}
            <DropdownMenuItem asChild>
                <button
                    onClick={handleLogoutClick}
                    data-test="logout-button"
                    className="
                        flex items-center
                        w-full rounded-md
                        px-2 py-1.5
                        text-[color:var(--sidebar-danger)]
                        hover:bg-[color:var(--sidebar-danger-bg)]
                        focus:bg-[color:var(--sidebar-danger-bg)]
                    "
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </button>
            </DropdownMenuItem>

            {/* LOGOUT MODAL */}
            <LogoutConfirmationModal
                open={showLogoutModal}
                onOpenChange={setShowLogoutModal}
                onConfirm={handleLogoutConfirm}
            />
        </>
    );
}