import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function readAttribute(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useAutoTheme(override: Theme | undefined): Theme {
  const [theme, setTheme] = useState<Theme>(() => override ?? readAttribute());

  useEffect(() => {
    if (override) {
      setTheme(override);
      return;
    }

    setTheme(readAttribute());

    if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
      return;
    }

    const observer = new MutationObserver(() => {
      setTheme(readAttribute());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [override]);

  return theme;
}
