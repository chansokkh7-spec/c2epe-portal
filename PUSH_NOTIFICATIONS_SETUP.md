# Push Notifications Setup — C2-EPE Digital Academy

Follow these steps **in order**. Steps 1–3 are done in your web browser
(Firebase Console). Step 4 needs Command Prompt. Step 5 is uploading files
you already have.

---

## Step 1 — Upgrade to the Blaze plan

1. Go to https://console.firebase.google.com and open your project
   (`c2epe-school-share-and-post`).
2. Click the ⚙️ gear icon (top-left) → **Usage and billing**.
3. Click **Modify plan** → choose **Blaze (Pay as you go)**.
4. Link a billing card. (You will very likely pay **$0/month** — see the
   free-tier explanation Claude gave you earlier. New projects also get
   **$300 in free credit**.)

---

## Step 2 — Generate your VAPID key

1. Still in Firebase Console → ⚙️ gear icon → **Project settings**.
2. Click the **Cloud Messaging** tab.
3. Scroll to **Web configuration** → **Web Push certificates**.
4. Click **Generate key pair**.
5. Copy the long key that appears (starts with something like `B...`).

---

## Step 3 — Paste the VAPID key into index.html

1. Open the `index.html` file Claude gave you in a text editor.
2. Find this line near the top (search for `PASTE_YOUR_VAPID_KEY_HERE` —
   it appears once):
   ```js
   const VAPID_KEY = "PASTE_YOUR_VAPID_KEY_HERE";
   ```
3. Replace `PASTE_YOUR_VAPID_KEY_HERE` with the key you copied in Step 2,
   keeping the quotes. Example:
   ```js
   const VAPID_KEY = "BKagUx8Example_your_real_key_goes_here_9fQ";
   ```
4. Save the file.

---

## Step 4 — Add the background handler to your existing sw.js

Your app already has a `sw.js` file (used for offline/PWA support). Open
it and paste **this exact block at the very top**, before anything else
already in the file:

```js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyAmATKmyTWQqqyNDqxbzN4CdTKAyzG1Dq4",
  authDomain:        "c2epe-school-share-and-post.firebaseapp.com",
  projectId:         "c2epe-school-share-and-post",
  storageBucket:     "c2epe-school-share-and-post.firebasestorage.app",
  messagingSenderId: "109849107156",
  appId:             "1:109849107156:web:0b67b05f3511d2f0893941"
});

const messaging = firebase.messaging();
// This fires when a notification arrives while the app is CLOSED or in
// the background — it shows the actual system notification banner.
messaging.onBackgroundMessage(function(payload) {
  var n = payload.notification || {};
  self.registration.showNotification(n.title || "C2-EPE School", {
    body: n.body || "",
    icon: "./seg-shield.png"
  });
});
```

**Do not remove anything already in `sw.js`** — just add this block above
the existing content. If you're not sure what's already in there, you can
paste the full current contents back to Claude and it will merge it for
you precisely.

---

## Step 5 — Deploy the Cloud Function (this is the Command Prompt part)

Open Command Prompt and run these one at a time:

```bash
# 1. Install the Firebase command-line tool (only needed once, ever)
npm install -g firebase-tools

# 2. Log into your Google account
firebase login

# 3. Make a new folder anywhere convenient, and go into it
mkdir c2epe-notifications
cd c2epe-notifications

# 4. Connect it to your Firebase project
firebase init functions
#    - "Use an existing project" -> select c2epe-school-share-and-post
#    - Language: JavaScript
#    - ESLint: No (keep it simple)
#    - Install dependencies now: Yes
```

This creates a `functions` folder. **Replace its two files**
(`functions/index.js` and `functions/package.json`) with the two files
Claude gave you — just overwrite them.

Then deploy:

```bash
firebase deploy --only functions
```

Wait for it to finish (a minute or two). You should see three function
names listed as deployed: `onNewConversationMessage`, `onNewCall`,
`onNewClassGroupMessage`.

---

## Step 6 — Upload & test

1. Upload the updated `index.html` and `sw.js` to your hosting (same as
   always).
2. Open the app, log in as a teacher, and tap **🔔 Turn On Notifications**
   in the Tools menu (or the parent role banner if testing as a parent).
3. Allow the browser's permission prompt.
4. Close the app tab completely (or lock the phone).
5. Send yourself a test message from another device/account.
6. A notification should appear within a few seconds.

If nothing arrives, open the browser console (F12) on the device that
enabled notifications and check for red error text — send that to Claude
and it can help debug from there.
