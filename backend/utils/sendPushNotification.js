const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure VAPID once
webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Send push notification to specific user(s) by userId array
 * @param {ObjectId[]} userIds  - Array of MongoDB user IDs
 * @param {{ title, body, url }} payload
 */
const sendPushToUsers = async (userIds, payload) => {
    if (!userIds || userIds.length === 0) return;

    const subscriptions = await PushSubscription.find({
        userId: { $in: userIds }
    });

    if (subscriptions.length === 0) return;

    const notifPayload = JSON.stringify({
        title: payload.title,
        body:  payload.body,
        url:   payload.url || '/'
    });

    const results = await Promise.allSettled(
        subscriptions.map(sub =>
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: sub.keys },
                notifPayload
            ).catch(async (err) => {
                // 410 Gone = subscription expired, clean it up
                if (err.statusCode === 410) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
                throw err;
            })
        )
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
        console.log(`[Push] Sent ${results.length - failed}/${results.length} notifications`);
    }
};

/**
 * Send push notification to ALL users of a role
 * @param {'admin'|'teacher'|'student'} role
 * @param {{ title, body, url }} payload
 */
const sendPushToRole = async (role, payload) => {
    const subscriptions = await PushSubscription.find({ userRole: role });
    if (subscriptions.length === 0) return;

    const notifPayload = JSON.stringify({
        title: payload.title,
        body:  payload.body,
        url:   payload.url || '/'
    });

    await Promise.allSettled(
        subscriptions.map(sub =>
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: sub.keys },
                notifPayload
            ).catch(async (err) => {
                if (err.statusCode === 410) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
            })
        )
    );
};

module.exports = { sendPushToUsers, sendPushToRole };