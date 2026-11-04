"use client";

import { useEffect } from "react";

/** Scrolls to the element named by the URL hash once the section holding it is on screen (sections mount one at a time). */
export default function ScrollToHash() {
  useEffect(() => {
    document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
  }, []);
  return null;
}
