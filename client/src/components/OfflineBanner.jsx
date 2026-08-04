import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="bg-amber-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
            <WifiOff className="h-4 w-4 animate-bounce" />
            <span>Connection Offline. You are operating in offline mode — live server requests may fail.</span>
        </div>
    );
}
