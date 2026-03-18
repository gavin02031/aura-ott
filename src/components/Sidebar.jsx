import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useProfiles } from '../context/ProfileContext.jsx';

function Icon({ children }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center">
      {children}
    </span>
  );
}

function RailLink({ to, label, expanded, onClick, children }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex h-11 w-full items-center gap-3 rounded-xl transition-all duration-300 ${
          isActive
            ? 'text-aura-red font-semibold'
            : 'text-white text-opacity-70 hover:text-opacity-100'
        } ${expanded ? 'justify-start px-3' : 'justify-center px-0'}`
      }
      aria-label={label}
      title={label}
    >
      <span className="pointer-events-none absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-aura-red opacity-0 transition-opacity duration-300 group-[.active]:opacity-100" />
      {children}
      <span className={`min-w-0 truncate text-sm font-medium tracking-wide transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
        {label}
      </span>
    </NavLink>
  );
}

function Sidebar({ onOpenSearch, onOpenFriends }) {
  const { currentProfile } = useProfiles();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <aside className="fixed left-3 top-1/2 z-50 hidden -translate-y-1/2 md:block">
      <div
        className={`aura-glass flex flex-col rounded-2xl p-3 shadow-cinematic transition-all duration-300 ${
          expanded ? 'w-52' : 'w-20'
        }`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="mb-1 flex items-center justify-center px-1 py-1">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-aura-red">
              A
            </span>
            {expanded && (
              <span className="text-sm font-semibold tracking-wide text-white text-opacity-90">
                Aura
              </span>
            )}
          </Link>
        </div>

        <div className="flex flex-col gap-1">
        <RailLink to="/" label="Home" expanded={expanded}>
          <Icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 10.5 12 3.75l8.25 6.75V20.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V10.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21.75V14.25h4.5v7.5" />
            </svg>
          </Icon>
        </RailLink>

        <button
          type="button"
          onClick={onOpenSearch}
          className={`group relative flex h-11 w-full items-center gap-3 rounded-xl text-white text-opacity-70 transition-all duration-300 hover:bg-white hover:bg-opacity-5 hover:text-opacity-100 ${
            expanded ? 'justify-start px-3' : 'justify-center px-0'
          }`}
          aria-label="Search"
          title="Search"
        >
          <Icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75 19.5 19.5" />
              <circle cx="11" cy="11" r="6" />
            </svg>
          </Icon>
          <span className={`min-w-0 truncate text-sm font-medium tracking-wide transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            Search
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenFriends}
          className={`group relative flex h-11 w-full items-center gap-3 rounded-xl text-white text-opacity-70 transition-all duration-300 hover:bg-white hover:bg-opacity-5 hover:text-opacity-100 ${
            expanded ? 'justify-start px-3' : 'justify-center px-0'
          }`}
          aria-label="Friends"
          title="Friends"
        >
          <Icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </Icon>
          <span className={`min-w-0 truncate text-sm font-medium tracking-wide transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            Friends
          </span>
        </button>

        <RailLink to="/movies" label="Movies" expanded={expanded}>
          <Icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5A2.25 2.25 0 0 1 17.25 19.5H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 4.5v15M16.5 4.5v15" />
            </svg>
          </Icon>
        </RailLink>

        <RailLink to="/tv-shows" label="TV Shows" expanded={expanded}>
          <Icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 6.75A2.25 2.25 0 0 1 7.5 4.5h9A2.25 2.25 0 0 1 18.75 6.75v7.5A2.25 2.25 0 0 1 16.5 16.5h-9a2.25 2.25 0 0 1-2.25-2.25v-7.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19.5h6" />
            </svg>
          </Icon>
        </RailLink>

        <RailLink to="/my-list" label="My List" expanded={expanded}>
          <Icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 4.5h9A2.25 2.25 0 0 1 18.75 6.75v10.5A2.25 2.25 0 0 1 16.5 19.5h-9A2.25 2.25 0 0 1 5.25 17.25V6.75A2.25 2.25 0 0 1 7.5 4.5Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12 10.5 14.25 15.75 9" />
            </svg>
          </Icon>
        </RailLink>
        </div>

        <div className="my-2 h-px w-full bg-white bg-opacity-10" />

        <Link
          to="/profile"
          className={`flex items-center gap-3 rounded-xl py-2 text-white text-opacity-75 transition hover:bg-white hover:bg-opacity-5 hover:text-opacity-100 ${
            expanded ? 'px-3 justify-start' : 'px-0 justify-center'
          }`}
          title="Profile"
        >
          <img
            src={currentProfile?.avatar}
            alt={currentProfile?.name || 'Profile'}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-white ring-opacity-10"
          />
          <div className={`min-w-0 transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            <p className="truncate text-sm font-semibold text-white text-opacity-90">
              {currentProfile?.name || 'Profile'}
            </p>
            <p className="truncate text-xs text-aura-muted">Settings</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;

