// Sync: progress lives in Firestore (users/{uid}) behind Google sign-in, so the phone and the laptop share it.
// Off when js/firebase-config.js has no config, the Firebase SDK didn't load (offline), or the page is opened from a file.
// app.js wires getState/onRemote/onStatus; every local save calls SAA.sync.changed().
(function (SAA) {
  const sync = SAA.sync = { status: "off", user: null, error: "", changed() { }, signIn() { }, signOut() { }, replace() { } };
  const cfg = SAA.firebaseConfig;
  if (!cfg || !window.firebase || !/^https?:$/.test(location.protocol)) return;

  firebase.initializeApp(cfg);
  const auth = firebase.auth(), db = firebase.firestore();
  let unsub = null, timer = null, lastSynced = null;   // lastSynced: content of the doc as we last wrote or read it

  const set = (status, error = "") => { sync.status = status; sync.error = error; if (sync.onStatus) sync.onStatus(); };
  const content = S => { const o = Object.assign({}, S); delete o.view; delete o.ts; return SAA.canon(o); };
  const ref = () => db.collection("users").doc(sync.user.uid);

  async function push(force) {
    clearTimeout(timer); timer = null;
    if (!sync.user || !sync.getState) return;
    const S = sync.getState(), c = content(S);
    if (!force && c === lastSynced) return;
    if (c.length > 900000) return set("error", "Progress is too big to sync (over 900 KB).");
    const prev = lastSynced;
    lastSynced = c;   // before the await, so the echo of our own write isn't taken for a remote change
    try {
      set("syncing");
      await ref().set({ state: JSON.stringify(S), ts: S.ts || Date.now(), at: firebase.firestore.FieldValue.serverTimestamp() });
      set("ok");
    } catch (e) { lastSynced = prev; set("error", e.message); }
  }

  sync.changed = () => { if (sync.user && !timer) timer = setTimeout(push, 2000); };
  // Overwrite the cloud copy instead of merging (after a reset or an import).
  sync.replace = () => push(true);

  sync.signIn = () => {
    const p = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(p).catch(e => {
      if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") return auth.signInWithRedirect(p);
      if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") set("error", e.message);
    });
  };
  sync.signOut = () => auth.signOut();

  auth.onAuthStateChanged(u => {
    sync.user = u; lastSynced = null;
    if (unsub) { unsub(); unsub = null; }
    if (!u) return set("signed-out");
    set("syncing");
    unsub = ref().onSnapshot(snap => {
      if (snap.metadata.hasPendingWrites) return;   // our own write, not confirmed yet
      const data = snap.data();
      if (!data) return push(true);                  // first device: upload what we have
      let remote;
      try { remote = JSON.parse(data.state); } catch (e) { return set("error", "Cloud copy is unreadable."); }
      const rc = content(remote);
      if (rc === lastSynced) return set("ok");
      lastSynced = rc;
      if (sync.onRemote) sync.onRemote(remote);     // app merges, saves and re-renders; changed() pushes the merge if it differs
      if (content(sync.getState()) === rc) set("ok"); else push();
    }, e => set("error", e.message));
  });

  // Flush pending changes when the tab is hidden (phone locks, app switch).
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && timer) push(); });
  set("checking");
})(window.SAA);
