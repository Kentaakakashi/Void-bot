const {
  cert,
  getApps,
  initializeApp
} = require("firebase-admin/app");

const {
  getFirestore
} = require("firebase-admin/firestore");

const config = require("../config/config");
const logger = require("../utils/logger");

let db = null;

function normalizePrivateKey(value) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r");
}

function initializeDatabase() {
  if (db) {
    return db;
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: normalizePrivateKey(
            config.firebase.privateKey
          )
        })
      });

  db = getFirestore(app);

  logger.info("Firestore initialized.");

  return db;
}

function getDatabase() {
  return db || initializeDatabase();
}

module.exports = {
  initializeDatabase,
  getDatabase
};