import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function NavigationTracker() {
    const location = useLocation();
    useEffect(() => {
        // Navigation tracking - no-op in standalone mode
    }, [location]);
    return null;
}
