/**
 * C2-EPE Digital Academy — Push Notification Cloud Functions
 * =============================================================
 * Deploy with:  firebase deploy --only functions
 *
 * V1 SCOPE (kept intentionally simple/reliable — can be refined later):
 *   - New 1:1 message FROM a teacher  -> notify that specific parent
 *   - New 1:1 message FROM a parent   -> notify the school Admin
 *     (the Admin already sees every conversation, so this guarantees
 *      SOMEONE is notified even before we add "which teacher owns which
 *      class" routing — Admin can then forward internally)
 *   - New outgoing call (status "ringing") -> same rule as messages
 *   - New Class Group broadcast -> notify every parent/student token
 *     whose saved class matches the group's class
 *
 * All of this reads the "fcmTokens" collection the app already writes to
 * (see requestNotificationPermission() in index.html), keyed by device
 * token, with fields: { token, role, identity, name, cls, updatedAt }.
 *   - role "teacher": identity = teacher's login email
 *   - role "parent":  identity = studentId, cls = student's class
 */

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

const ADMIN_EMAIL = "chansok.kh7@gmail.com"; // must match ADMIN_EMAIL in index.html

// Looks up every saved device token matching a role+identity pair (a
// person can have more than one device/browser registered).
async function tokensFor(role, identity) {
  if (!identity) return [];
  const snap = await db.collection("fcmTokens")
    .where("role", "==", role)
    .where("identity", "==", identity)
    .get();
  return snap.docs.map((d) => d.id); // doc id == the token itself
}

async function tokensForClassGroup(cls) {
  const snap = await db.collection("fcmTokens")
    .where("role", "==", "parent")
    .where("cls", "==", cls)
    .get();
  return snap.docs.map((d) => d.id);
}

// Sends to a list of tokens, dropping any that Firebase reports as dead
// (uninstalled app, revoked permission, etc.) so the fcmTokens collection
// self-cleans over time instead of accumulating stale entries.
async function sendAndPrune(tokens, notification, data) {
  if (!tokens.length) return;
  const res = await messaging.sendEachForMulticast({
    tokens,
    notification,
    data: data || {},
    webpush: { fcmOptions: { link: "/" } },
  });
  const deletions = [];
  res.responses.forEach((r, i) => {
    if (!r.success && (r.error?.code === "messaging/registration-token-not-registered")) {
      deletions.push(db.collection("fcmTokens").doc(tokens[i]).delete());
    }
  });
  await Promise.all(deletions);
}

// ── New 1:1 chat message ─────────────────────
exports.onNewConversationMessage = onDocumentCreated(
  "conversations/{convId}/messages/{msgId}",
  async (event) => {
    const msg = event.data.data();
    if (!msg) return;
    const convSnap = await db.collection("conversations").doc(event.params.convId).get();
    const conv = convSnap.data();
    if (!conv) return;

    let tokens = [];
    let title = "New message";
    if (msg.role === "teacher") {
      tokens = await tokensFor("parent", conv.studentId);
      title = (msg.senderName || "Teacher") + " sent a message";
    } else {
      tokens = await tokensFor("teacher", ADMIN_EMAIL);
      title = (msg.senderName || "A parent") + " sent a message";
    }
    await sendAndPrune(tokens, {
      title,
      body: msg.text ? msg.text.slice(0, 120) : "📷 Sent a photo/video",
    }, { type: "message", convId: event.params.convId });
  }
);

// ── New outgoing call ─────────────────────────
exports.onNewCall = onDocumentCreated(
  "conversations/{convId}/calls/{callId}",
  async (event) => {
    const call = event.data.data();
    if (!call || call.status !== "ringing") return;
    const convSnap = await db.collection("conversations").doc(event.params.convId).get();
    const conv = convSnap.data();
    if (!conv) return;

    let tokens = [];
    if (call.fromRole === "teacher") {
      tokens = await tokensFor("parent", conv.studentId);
    } else {
      tokens = await tokensFor("teacher", ADMIN_EMAIL);
    }
    await sendAndPrune(tokens, {
      title: (call.from || "Someone") + " is calling",
      body: (call.type === "video" ? "📹 Video call" : "📞 Voice call") + " — open the app to answer",
    }, { type: "call", convId: event.params.convId, callId: event.params.callId });
  }
);

// ── New Class Group broadcast ─────────────────
exports.onNewClassGroupMessage = onDocumentCreated(
  "classGroupMessages/{msgId}",
  async (event) => {
    const msg = event.data.data();
    if (!msg || !msg.cls) return;
    const tokens = await tokensForClassGroup(msg.cls);
    await sendAndPrune(tokens, {
      title: "📢 " + msg.cls + " class announcement",
      body: msg.text ? msg.text.slice(0, 120) : "📷 Sent a photo/video",
    }, { type: "classGroup", cls: msg.cls });
  }
);
