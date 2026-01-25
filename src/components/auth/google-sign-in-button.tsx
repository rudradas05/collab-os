"use client";

import Script from "next/script";

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
  const handleGoogleLoad = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: (response) => {
          onSuccess(response.credential);
        },
      });

      const buttonDiv = document.getElementById("google-signin-button");
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: "outline",
          size: "large",
          text,
          width: 320,
        });
      }
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={handleGoogleLoad}
        strategy="lazyOnload"
      />
      <div id="google-signin-button" className="flex justify-center" />
    </>
  );
}
