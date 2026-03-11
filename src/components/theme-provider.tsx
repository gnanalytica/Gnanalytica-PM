"use client";

import { useEffect } from "react";

function applyInitialTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyInitialTheme();
  }, []);

  return <>{children}</>;
}
