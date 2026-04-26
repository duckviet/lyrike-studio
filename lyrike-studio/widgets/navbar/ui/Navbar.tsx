import Link from "next/link";

export const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link href="/" className="navbar-logo">
            <div className="logo-icon" />
            <span>Lyrike Studio</span>
          </Link>
          <div className="navbar-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/projects" className="nav-link">Projects</Link>
          </div>
        </div>
        
        <div className="navbar-right">
          <Link href="/account" className="nav-link">Account</Link>
        </div>
      </div>
    </nav>
  );
};
