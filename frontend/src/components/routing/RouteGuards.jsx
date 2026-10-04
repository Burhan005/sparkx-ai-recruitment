import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { SkeletonKPI, SkeletonCard } from '../ui/Primitives';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#110F0D] flex flex-col">
      <div className="h-16 bg-white/90 dark:bg-[#1A1714]/90 border-b border-stone-200 dark:border-stone-800 animate-pulse" />
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 pt-8 space-y-8">
        <div className="space-y-2">
          <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-full w-40 animate-pulse" />
          <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded-full w-64 animate-pulse" />
        </div>
        <SkeletonKPI />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} lines={4} />)}
        </div>
      </div>
    </div>
  );
}

/**
 * RequireAuth: Guards authenticated routes.
 * If user clicked Sign Out, immediately navigates to /home.
 * While initializing, renders LoadingScreen.
 * If unauthenticated, redirects to /login preserving current location.
 */
export function RequireAuth({ children }) {
  const { authStatus, currentUser, isLoading, isLoggingOut } = useRecruitment();
  const location = useLocation();

  if (isLoggingOut) {
    return <Navigate to="/home" replace />;
  }

  if (authStatus === 'INITIALIZING' || (isLoading && !currentUser)) {
    return <LoadingScreen />;
  }

  if (authStatus === 'UNAUTHENTICATED' || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * RequireRole: Guards role-specific areas (candidate vs recruiter).
 * If user clicked Sign Out, immediately navigates to /home.
 * If role does not match, redirects to user's authorized home area.
 */
export function RequireRole({ role, roles, redirectTo, children }) {
  const { authStatus, currentUser, userRole, isLoading, isLoggingOut } = useRecruitment();
  const location = useLocation();

  if (isLoggingOut) {
    return <Navigate to="/home" replace />;
  }

  if (authStatus === 'INITIALIZING' || (isLoading && !currentUser)) {
    return <LoadingScreen />;
  }

  if (authStatus === 'UNAUTHENTICATED' || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = roles || (role ? [role] : []);
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    const destination = redirectTo || (userRole === 'recruiter' ? '/recruiter' : '/jobs');
    return <Navigate to={destination} replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * RequirePublic: For public auth routes (/login, /register).
 * If already authenticated, redirects to the user's dashboard.
 */
export function RequirePublic({ children }) {
  const { authStatus, currentUser, userRole, isLoading } = useRecruitment();
  const location = useLocation();

  if (authStatus === 'INITIALIZING' || (isLoading && !currentUser)) {
    return <LoadingScreen />;
  }

  if (authStatus === 'AUTHENTICATED' && currentUser) {
    const from = location.state?.from?.pathname;
    const defaultPath = userRole === 'recruiter' ? '/recruiter' : '/jobs';
    return <Navigate to={from || defaultPath} replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * RootRedirect: Determines destination for root index path (/).
 * Canonical public home is /home.
 */
export function RootRedirect() {
  const { authStatus, currentUser, userRole, isLoading } = useRecruitment();

  if (authStatus === 'INITIALIZING' || (isLoading && !currentUser)) {
    return <LoadingScreen />;
  }

  if (authStatus === 'AUTHENTICATED' && currentUser) {
    return <Navigate to={userRole === 'recruiter' ? '/recruiter' : '/jobs'} replace />;
  }

  return <Navigate to="/home" replace />;
}
