import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useProfiles } from '../context/ProfileContext.jsx';

function Header({ onOpenSearch, onOpenFriends }) {
  const { currentProfile } = useProfiles();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `relative px-1 py-1 text-sm font-medium tracking-wide transition-colors ${
      isActive ? 'text-white' : 'text-white/75 hover:text-white'
    }`;

  return (
    <header
      className={`${
        scrolled
          ? 'fixed bg-aura-bg bg-opacity-80 backdrop-blur-md border-b border-white border-opacity-5'
          : 'absolute bg-gradient-to-b from-black/80 to-transparent'
      } top-0 inset-x-0 z-40 transition-all duration-300`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:pl-24 md:pr-10">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-aura-red">
              Aura
            </span>
          </Link>
          <nav className="hidden gap-4 text-sm font-medium text-gray-200 md:flex">
            <NavLink
              to="/"
              className={navLinkClass}
            >
              {({ isActive }) => (
                <span className="relative">
                  Home
                  <span
                    className={`absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-aura-red transition-transform duration-300 ${
                      isActive ? 'scale-100' : 'scale-0'
                    }`}
                  />
                </span>
              )}
            </NavLink>
            <NavLink to="/tv-shows" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative">
                  TV Shows
                  <span
                    className={`absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-aura-red transition-transform duration-300 ${
                      isActive ? 'scale-100' : 'scale-0'
                    }`}
                  />
                </span>
              )}
            </NavLink>
            <NavLink to="/movies" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative">
                  Movies
                  <span
                    className={`absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-aura-red transition-transform duration-300 ${
                      isActive ? 'scale-100' : 'scale-0'
                    }`}
                  />
                </span>
              )}
            </NavLink>
            <NavLink to="/my-list" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative">
                  My List
                  <span
                    className={`absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-aura-red transition-transform duration-300 ${
                      isActive ? 'scale-100' : 'scale-0'
                    }`}
                  />
                </span>
              )}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenSearch}
            className="aura-icon-button"
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 15.75 19.5 19.5"
              />
              <circle cx="11" cy="11" r="6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onOpenFriends}
            className="aura-icon-button"
            aria-label="Friends"
            title="Friends"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>

          <Link to="/profile" className="flex items-center gap-2">
            <img src={currentProfile.avatar} alt={currentProfile.name} className="w-8 h-8 rounded-full object-cover" />
            <span className="text-sm font-medium text-white">{currentProfile.name}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;

