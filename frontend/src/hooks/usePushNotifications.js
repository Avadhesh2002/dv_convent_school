import { useEffect, useRef } from 'react';
import api from '../api/axios';

/**
 * Converts a base64 URL string to Uint8Array
 * Required for PushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

/**
 * usePushNotifications
 * Call this hook once after login.
 * It registers the service worker, asks for permission,
 * and sends the subscription to the backend.
 */
export function usePushNotifications(isAuthenticated) {
    const subscribed = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || subscribed.current) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const setup = async () => {
            try {
                // 1. Register service worker
                const registration = await navigator.serviceWorker.register('/sw.js');

                // 2. Check existing subscription
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // 3. Get VAPID public key from backend
                    const { data } = await api.get('/push/vapid-public-key');
                    const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

                    // 4. Subscribe (this triggers browser permission prompt)
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey
                    });
                }

                // 5. Send subscription to backend
                await api.post('/push/subscribe', {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
                        auth:   btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
                    }
                });

                subscribed.current = true;
                console.log('[Push] Subscribed successfully');
            } catch (err) {
                // User denied permission or browser doesn't support — fail silently
                console.log('[Push] Not subscribed:', err.message);
            }
        };

        setup();
    }, [isAuthenticated]);
}