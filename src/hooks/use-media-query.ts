"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query = "(max-width: 640px)") {
  const [matches, setMatches] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    setIsMobile(window.matchMedia("(max-width: 640px)").matches);

    const listener = () => {
      setMatches(media.matches);
      setIsMobile(window.matchMedia("(max-width: 640px)").matches);
    };
    
    // Add listener
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }
    
    return () => {
      // Remove listener
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", listener);
      } else {
        // Fallback for older browsers
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return { matches, isMobile };
} 