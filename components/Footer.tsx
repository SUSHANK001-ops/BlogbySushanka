import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-top">
          {/* Left — Brand */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <Image
                src="/logo.png"
                alt="BlogbySushanka"
                width={28}
                height={28}
                className="footer-logo-img"
              />
              <span className="footer-logo-text">BlogbySushanka</span>
            </Link>
            <p className="footer-tagline">
              Thoughts, stories, and ideas — shared with the world.
            </p>
          </div>

          {/* Center — Links */}
          <div className="footer-links">
            <h5 className="footer-links-title">Links</h5>
            <Link href="/" className="footer-link">Home</Link>
            <a
              href="https://sushanka.com.np"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Portfolio
            </a>
          </div>

          {/* Right — Portfolio CTA */}
          <div className="footer-cta">
            <p className="footer-cta-text">Check out my portfolio</p>
            <a
              href="https://sushanka.com.np"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-cta-btn"
              id="portfolio-link"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              sushanka.com.np
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} Sushanka. All rights reserved.
          </p>
          <p className="footer-made">
            Made with ♥ in Nepal
          </p>
        </div>
      </div>

      {/* Flower illustration */}
      <div className="footer-flowers">
        <Image
          src="/footer.png"
          alt="Decorative flowers"
          width={1920}
          height={300}
          className="footer-flowers-img"
          priority={false}
        />
      </div>
    </footer>
  );
}
