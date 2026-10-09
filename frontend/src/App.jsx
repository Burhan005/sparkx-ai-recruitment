import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RecruitmentProvider, onContextToast } from './context/RecruitmentContext';
import { ToastProvider, useToast } from './components/ui/Toast';
import AppLayout from './components/layout/AppLayout';
import SignOutModal from './components/layout/SignOutModal';
import { RequireAuth, RequireRole, RequirePublic, RootRedirect } from './components/routing/RouteGuards';
import { FadeInUp } from './components/ui/Primitives';
import ErrorBoundary from './components/ui/ErrorBoundary';
import GlobalScrollProgress from './components/layout/GlobalScrollProgress';
import CosmicThemeWave from './components/ui/CosmicThemeWave';

import { PageTransitionProvider } from './context/PageTransitionContext';

// Route-level code splitting with React.lazy()
const LoginScreen = lazy(() => import('./components/auth/LoginScreen'));
const CandidatePipeline = lazy(() => import('./components/Recruiter/CandidatePipeline'));
const JobCatalog = lazy(() => import('./components/Candidate/JobCatalog'));
const AIInterviewRoom = lazy(() => import('./components/Candidate/AIInterviewRoom'));
const CodeAssessment = lazy(() => import('./components/Candidate/CodeAssessment'));
const SkillGapReport = lazy(() => import('./components/Candidate/SkillGapReport'));
const SkillPassportView = lazy(() => import('./components/Candidate/SkillPassportView'));
const MyApplications = lazy(() => import('./components/Candidate/MyApplications'));
const ProctorLiveMonitor = lazy(() => import('./components/Proctor/ProctorLiveMonitor'));
const AssessmentStudio = lazy(() => import('./components/Recruiter/AssessmentStudio'));
const AssessmentBuilder = lazy(() => import('./components/Recruiter/AssessmentBuilder'));
const RecruiterAvailabilityManager = lazy(() => import('./components/Recruiter/RecruiterAvailabilityManager'));
const NotFoundScreen = lazy(() => import('./components/ui/NotFoundScreen'));
const LandingPage = lazy(() => import('./components/public/LandingPage'));

// ─── Route Loading Fallback ──────────────────────────────────────────────────
function PageFallback() {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-brand-600/20 border-t-brand-600 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-brand-500/20 border-b-brand-500 animate-spin [animation-direction:reverse]" />
      </div>
      <div className="text-center space-y-0.5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">SparkX OS</p>
        <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">Loading module...</p>
      </div>
    </div>
  );
}

// ─── Toast bridge ─────────────────────────────────────────────────────────────
function ToastBridge() {
  const toast = useToast();
  useEffect(() => onContextToast((msg, type) => toast(msg, type || 'info')), [toast]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalScrollProgress />
      <ToastProvider>
        <RecruitmentProvider>
          <CosmicThemeWave />
          <ToastBridge />
          <SignOutModal />
          <PageTransitionProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
              <Routes>
              {/* Public Canonical Home & Website Routes */}
              <Route path="/home" element={<LandingPage />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/about" element={<LandingPage />} />
              <Route path="/features" element={<LandingPage />} />
              <Route path="/how-it-works" element={<LandingPage />} />
              <Route path="/contact" element={<LandingPage />} />

              {/* Public authentication routes */}
              <Route
                path="/login"
                element={
                  <RequirePublic>
                    <LoginScreen mode="signin" />
                  </RequirePublic>
                }
              />
              <Route path="/signin" element={<Navigate to="/login" replace />} />
              <Route
                path="/register"
                element={
                  <RequirePublic>
                    <LoginScreen mode="signup" />
                  </RequirePublic>
                }
              />
              <Route path="/signup" element={<Navigate to="/register" replace />} />
              <Route
                path="/forgot-password"
                element={
                  <RequirePublic>
                    <LoginScreen mode="forgot" />
                  </RequirePublic>
                }
              />

              {/* Authenticated Application Layout */}
              <Route
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                {/* ─── Candidate-Only Requisition & Applications ─── */}
                <Route element={<RequireRole role="candidate" redirectTo="/recruiter" />}>
                  <Route path="/my-applications" element={<MyApplications />} />
                </Route>

                {/* ─── Candidate & Recruiter Shared Module Routes ─── */}
                <Route element={<RequireRole roles={['candidate', 'recruiter']} />}>
                  <Route path="/jobs" element={<JobCatalog />} />
                  <Route path="/jobs/:jobId/apply" element={<JobCatalog />} />
                  <Route path="/interview" element={<AIInterviewRoom />} />
                  <Route path="/interview/:candidateId" element={<AIInterviewRoom />} />
                  <Route path="/assessment" element={<CodeAssessment />} />
                  <Route path="/assessment/:candidateId" element={<CodeAssessment />} />
                  <Route path="/skill-gap" element={<SkillGapReport />} />
                  <Route path="/skill-gap/:candidateId" element={<SkillGapReport />} />
                  <Route path="/skill-passport" element={<SkillPassportView />} />
                  <Route path="/skill-passport/:candidateId" element={<SkillPassportView />} />
                </Route>

                {/* ─── Recruiter Protected Routes ─── */}
                <Route element={<RequireRole role="recruiter" />}>
                  <Route path="/recruiter" element={<CandidatePipeline />} />
                  <Route path="/recruiter/pipeline" element={<Navigate to="/recruiter" replace />} />
                  <Route path="/recruiter/jobs/:jobId" element={<CandidatePipeline />} />
                  <Route path="/recruiter/candidates/:candidateId" element={<CandidatePipeline />} />
                  <Route path="/recruiter/proctor" element={<ProctorLiveMonitor />} />
                  <Route path="/recruiter/assessment-studio" element={<AssessmentStudio defaultTab="assessment" />} />
                  <Route path="/recruiter/assessment-builder" element={<AssessmentBuilder />} />
                  <Route path="/recruiter/interview-studio" element={<AssessmentStudio defaultTab="interview" />} />
                  <Route path="/recruiter/availability" element={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-enter"><RecruiterAvailabilityManager /></div>} />
                </Route>
              </Route>

              {/* ─── 404 Catch-All ─── */}
              <Route path="*" element={<NotFoundScreen />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
          </PageTransitionProvider>
        </RecruitmentProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}