import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db, googleProvider } from './firebase';

const COLLECTION = 'documents';

export const watchUser = (callback) => onAuthStateChanged(auth, callback);

export const signIn = () => signInWithPopup(auth, googleProvider);

export const signOutUser = () => signOut(auth);

// The list view needs a handful of fields to render a row; keeping them
// alongside the full document avoids reading every document just to list them.
const summarise = (data) => {
  const isQuote = data.documentType === 'quote';
  const taxRate = Number(data.taxRate) || 0;
  const subtotal = (data.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  return {
    documentType: isQuote ? 'quote' : 'invoice',
    number: (isQuote ? data.quoteNumber : data.invoiceNumber) || '',
    clientName: data.client?.name || '',
    date: data.date || '',
    total: subtotal + (subtotal * taxRate) / 100,
  };
};

export const saveDocument = async (user, data, existingId = null) => {
  const payload = {
    ...summarise(data),
    ownerId: user.uid,
    data,
    updatedAt: serverTimestamp(),
  };

  if (existingId) {
    await setDoc(doc(db, COLLECTION, existingId), payload, { merge: true });
    return existingId;
  }

  const created = await addDoc(collection(db, COLLECTION), { ...payload, createdAt: serverTimestamp() });
  return created.id;
};

export const listDocuments = async (user) => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(100)
    )
  );

  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
};

export const deleteDocument = (documentId) => deleteDoc(doc(db, COLLECTION, documentId));
