import  AppLogoIcon  from './app-logo-icon';
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function AppLogo() {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <div className={cn(
            "flex items-center justify-center transition-all duration-300 ease-in-out",
            // Increased container size for a "bigger" look
            isCollapsed ? "size-10" : "size-16" 
        )}>
            <AppLogoIcon className={cn(
                "fill-current text-white transition-all duration-300",
                // size-8 (32px) or size-9 (36px) fits well in a 56px collapsed sidebar
                isCollapsed ? "h-9 w-9" : "h-16 w-auto"
            )} />
        </div>
    );
}
