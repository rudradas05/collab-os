"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Script from "next/script";
import { motion } from "motion/react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number;
            },
          ) => void;
        };
      };
    };
    googleScriptLoaded?: boolean;
  }
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}

export function GoogleSignInButton({
  onSuccess,
  text = "continue_with",
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const onSuccessRef = useRef(onSuccess);

  // Keep the callback ref updated
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const renderButton = useCallback(() => {
    if (window.google && buttonRef.current) {
      // Clear any existing button
      buttonRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: (response) => {
          onSuccessRef.current(response.credential);
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text,
        width: 320,
      });

      setIsLoaded(true);
    }
  }, [text]);

  // Handle script load
  const handleGoogleLoad = useCallback(() => {
    window.googleScriptLoaded = true;
    renderButton();
  }, [renderButton]);

  // Try to render on mount if script is already loaded
  useEffect(() => {
    if (window.google && window.googleScriptLoaded) {
      renderButton();
    }
  }, [renderButton]);

  // Retry mechanism - try again after a short delay if not loaded
  useEffect(() => {
    if (!isLoaded) {
      const retryTimeout = setTimeout(() => {
        if (window.google) {
          renderButton();
        }
      }, 500);

      return () => clearTimeout(retryTimeout);
    }
  }, [isLoaded, renderButton]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={handleGoogleLoad}
        strategy="afterInteractive"
      />
      <div className="flex justify-center min-h-[44px] items-center">
        <div ref={buttonRef} />
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-6 py-3 border-2 rounded-md bg-white"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5 border-2 border-gray-300 border-t-primary rounded-full"
            />
            <span className="text-sm text-muted-foreground">
              Loading Google...
            </span>
          </motion.div>
        )}
      </div>
    </>
  );
}
