"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AuthModal } from "@/components/AuthModal";

export function Header() {
  const { data: session, status } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="header-logo" id="header-home">
            <span className="header-logo-icon">✦</span>
            <div>
              <h1 className="header-title">Blog</h1>
              <p className="header-subtitle">Thoughts & stories</p>
            </div>
          </Link>

          <nav className="header-nav">
            <Link href="/" className="header-nav-link">
              Home
            </Link>
            {status === "authenticated" && session?.user ? (
              <div className="header-user">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="header-avatar"
                  />
                )}
                <button
                  onClick={() => signOut()}
                  className="header-sign-out"
                  id="sign-out-btn"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="header-sign-in"
                id="sign-in-btn"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
