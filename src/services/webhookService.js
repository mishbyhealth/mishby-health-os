import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { validateWebhookSignature } from '../utils/validator';

/**
 * Handles health data webhooks from wearables/third-party apps
 * @param {object} payload - { userId, source, data, signature }
 * @returns {Promise<{success: boolean, docId?: string}>}
 */
export const handleWebhook = async (payload) => {
  try {
    // 1. Validate
    if (!validateWebhookSignature(payload)) {
      throw new Error('Invalid webhook signature');
    }

    const { userId, source, data } = payload;
    const auth = getAuth();
    const db = getFirestore();

    // 2. Verify user exists
    if (userId !== auth.currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    // 3. Save to Firestore
    const docRef = doc(db, `users/${userId}/healthData`, `${source}_${Date.now()}`);
    await setDoc(docRef, {
      ...data,
      source,
      timestamp: new Date().toISOString(),
      processed: false
    });

    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('Webhook processing failed:', error);
    throw new Error(`Webhook error: ${error.message}`);
  }
};