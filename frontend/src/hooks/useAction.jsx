import { useState } from "react";

// Button dabane par loading + message ek jagah handle karta hai
export function useAction(onDone) {
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (label, fn) => {
    setBusy(true);
    setMsg({ type: "info", text: `${label}... thoda wait karo` });
    try {
      const result = await fn();
      setMsg({ type: "info", text: `${label}: ${JSON.stringify(result)}` });
      await onDone?.();
    } catch (e) {
      setMsg({ type: "error", text: `${label} fail: ${e.message}` });
    } finally {
      setBusy(false);
    }
  };

  return { msg, busy, run };
}
