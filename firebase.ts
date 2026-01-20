import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc, 
  Firestore, 
  Unsubscribe,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser, 
  Auth 
} from 'firebase/auth';
import { validateTemplate } from './utils/validators';

// Validated Production Credentials
const firebaseConfig = {
  apiKey: "AIzaSyCq7E_cSTsohY6NlOHR6cBtH0or7W6C3bY", 
  authDomain: "cruzpham-trivia-prod.firebaseapp.com",
  projectId: "cruzpham-trivia-prod",
  storageBucket: "cruzpham-trivia-prod.firebasestorage.app",
  messagingSenderId: "453431707957",
  appId: "1:453431707957:web:15301432304863dd9c247c",
  measurementId: "G-F4G0T4YYY9"
};

let app: FirebaseApp | undefined;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Infrastructure handshake verification
export const isCloudEnabled = !!firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith("AIza");

try {
  // Ensure we don't initialize duplicate apps
  if (isCloudEnabled) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    if (app) {
      db = getFirestore(app);
      auth = getAuth(app);
    }
  }
} catch (error) {
  console.error("CruzPham Core: Infrastructure Handshake Error", error);
}

export { app, db, auth };
export const googleProvider = new GoogleAuthProvider();

/**
 * Authentication Proxies
 */
export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
};

/**
 * Sync User Metadata to Firestore
 */
export const syncUserRecord = async (user: { id: string; username: string; email: string }) => {
  if (!db || !auth?.currentUser || !isCloudEnabled || auth.currentUser.uid !== user.id) return;
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      uid: user.id,
      email: user.email,
      username: user.username,
      lastLogin: Date.now(),
      version: '2.0-secure'
    }, { merge: true });
  } catch (e: any) {
    // Log the specific error to aid debugging (likely permission-denied or network)
    console.warn(`User sync skipped: ${e.message || 'Persistence check failed'}`);
  }
};

/**
 * Real-time Data Listeners with Local Fallback
 */
const LOCAL_TEMPLATES = 'cruzpham_local_templates_v2';

export const subscribeToTemplates = (userId: string, callback: (templates: any[]) => void): Unsubscribe => {
  // Capture current UID precisely to align with Security Rules 'list' requirements
  const currentUid = auth?.currentUser?.uid;
  // If we have DB, Cloud is enabled, user is not guest, and the requested userId matches authenticated user
  const canUseCloud = db && isCloudEnabled && userId !== 'guest' && currentUid === userId;

  if (canUseCloud) {
    try {
      // Use orderBy and limit for performance and governance
      // Requires Firestore Composite Index: ownerId ASC, updatedAt DESC
      const q = query(
        collection(db!, 'templates'), 
        where('ownerId', '==', currentUid),
        orderBy('updatedAt', 'desc'),
        limit(20) 
      );

      return onSnapshot(q, (snapshot) => {
        const templates = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(templates);
      }, (error) => {
        console.warn(`Cloud restricted (Code: ${error.code}). Sequence fallback to Local Storage.`);
        // If cloud subscription fails, switch to local sync
        localTemplatesSync(userId, callback);
      });
    } catch (error) {
       console.warn("Cloud query construction failed.", error);
       return localTemplatesSync(userId, callback);
    }
  } else {
    return localTemplatesSync(userId, callback);
  }
};

const localTemplatesSync = (userId: string, callback: (templates: any[]) => void): Unsubscribe => {
  const sync = () => {
    const stored = localStorage.getItem(LOCAL_TEMPLATES);
    const data = stored ? JSON.parse(stored) : [];
    callback(data.filter((t: any) => t.ownerId === userId || userId === 'guest'));
  };
  sync();
  window.addEventListener('storage', sync);
  return () => window.removeEventListener('storage', sync);
};

export const subscribeToGameSession = (sessionId: string, callback: (session: any) => void): Unsubscribe => {
  if (db && isCloudEnabled) {
    return onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
      if (doc.exists()) callback(doc.data());
    }, (error) => {
      console.warn(`Session node restriction (${error.code}). Local Node active.`);
      localSessionSync(sessionId, callback);
    });
  } else {
    return localSessionSync(sessionId, callback);
  }
};

const localSessionSync = (sessionId: string, callback: (session: any) => void): Unsubscribe => {
  const sync = () => {
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (stored) callback(JSON.parse(stored));
  };
  sync();
  window.addEventListener('storage', sync);
  return () => window.removeEventListener('storage', sync);
}

export const upsertTemplate = async (template: any) => {
  // 1. Zod Validation
  let validatedTemplate;
  try {
    validatedTemplate = validateTemplate(template);
  } catch (err) {
    console.error("Template validation failed:", err);
    throw new Error("Invalid template data");
  }

  // 2. Audit Fields
  const currentUid = auth?.currentUser?.uid;
  const timestamp = Date.now();
  const finalTemplate = {
    ...validatedTemplate,
    updatedAt: timestamp,
    updatedBy: currentUid || 'system',
    createdAt: template.createdAt || timestamp // Preserve original creation time
  };

  const isAuthorized = currentUid && currentUid === finalTemplate.ownerId;
  const useCloud = db && isCloudEnabled && isAuthorized && finalTemplate.ownerId !== 'guest';

  // Attempt Cloud Sync
  if (useCloud) {
    try {
      const ref = doc(db!, 'templates', finalTemplate.id);
      await setDoc(ref, finalTemplate, { merge: true });
      return; // success, skip local fallback
    } catch (err) {
      console.warn('Cloud persistence failed. Engaging local storage fallback.', err);
    }
  }

  // Local Storage Logic
  try {
    const stored = localStorage.getItem(LOCAL_TEMPLATES);
    let data = stored ? JSON.parse(stored) : [];
    const idx = data.findIndex((t: any) => t.id === finalTemplate.id);
    if (idx > -1) data[idx] = { ...data[idx], ...finalTemplate };
    else data.push(finalTemplate);
    localStorage.setItem(LOCAL_TEMPLATES, JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error("Critical: Local persistence failed. Storage quota may be exceeded.", e);
  }
};

export const upsertSession = async (sessionId: string, data: any) => {
  const currentUid = auth?.currentUser?.uid;
  
  // Audit Fields for Session
  const finalSession = {
    ...data,
    updatedAt: Date.now(),
    updatedBy: currentUid || 'system'
  };

  const isAuthorized = currentUid && (finalSession.ownerId === currentUid);
  const useCloud = db && isCloudEnabled && isAuthorized && finalSession.ownerId !== 'guest';

  if (useCloud) {
    try {
      const ref = doc(db!, 'sessions', sessionId);
      await setDoc(ref, finalSession, { merge: true });
      return;
    } catch (err) {
       console.warn("Cloud session sync failed. Engaging local storage fallback.", err);
    }
  }
  
  // Local Fallback
  localStorage.setItem(`session_${sessionId}`, JSON.stringify(finalSession));
  window.dispatchEvent(new Event('storage'));
};