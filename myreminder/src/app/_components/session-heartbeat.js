'use client';
import { useEffect } from 'react';

export default function SessionHeartbeat() {
    useEffect(() => {
        const hit = () => fetch('/api/account/sessions/ping', { method: 'POST' });
        hit();
        const t = setInterval(hit, 5 * 60 * 1000);
        return () => clearInterval(t);
    }, []);
    return null;
}
