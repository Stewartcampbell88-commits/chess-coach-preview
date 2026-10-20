// Service-worker registration + "Check for update" / "Update now" (ported from v5).
export function toast(msg, desc) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = desc ? `${msg} — ${desc}` : msg;
  el.classList.remove("hide");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add("hide"), 2800);
}

export function initUpdates(onChange) {
  const state = { updateReady: false, updateChecking: false };
  let swReg = null;
  let refreshing = false;
  const canSw = location.protocol.startsWith("http") && "serviceWorker" in navigator;

  async function apply() {
    const reg = swReg || (await navigator.serviceWorker.getRegistration());
    const waiting = reg && reg.waiting;
    if (waiting) {
      refreshing = true;
      waiting.postMessage({ type: "SKIP_WAITING" });
      setTimeout(() => location.reload(), 1500);
      return;
    }
    try { await reg?.update(); } catch {}
    location.reload();
  }

  async function check() {
    if (!canSw) {
      toast("Updates need the web app", "Open the GitHub Pages link, not a downloaded file.");
      return;
    }
    state.updateChecking = true;
    toast("Checking…");
    onChange();
    try {
      const reg = swReg || (await navigator.serviceWorker.getRegistration());
      if (!reg) {
        toast("No service worker yet");
      } else {
        await reg.update();
        await new Promise((r) => setTimeout(r, 600));
        const pending = Boolean(reg.waiting || (reg.installing && navigator.serviceWorker.controller));
        if (pending || state.updateReady) {
          state.updateReady = true;
          toast("Update available");
        } else {
          toast("You're on the latest");
        }
      }
    } catch {
      toast("Check failed");
    }
    state.updateChecking = false;
    onChange();
  }

  if (canSw) {
    const watchInstalling = (worker) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          state.updateReady = true;
          onChange();
        }
      });
    };
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
    navigator.serviceWorker.register(new URL("sw.js", location.href).href).then((reg) => {
      swReg = reg;
      try { reg.update(); } catch {}
      reg.addEventListener("updatefound", () => watchInstalling(reg.installing));
      if (reg.waiting && navigator.serviceWorker.controller) {
        state.updateReady = true;
        onChange();
      }
      watchInstalling(reg.installing);
    }).catch(() => {});
    const poke = () => {
      if (document.visibilityState !== "visible") return;
      if (swReg && typeof swReg.update === "function") { try { swReg.update(); } catch {} }
    };
    document.addEventListener("visibilitychange", poke);
    window.addEventListener("focus", poke);
    setInterval(poke, 60 * 60 * 1000);
  }

  return { check, apply, state };
}
