import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RecruitmentProvider, onContextToast } from './context/RecruitmentContext';
import { ToastProvider, useToast } from './components/ui/Toast';
import AppLayout from './components/layout/AppLayout';
import { RequireAuth, RequireRole, RequirePublic, RootRedirect } from './components/routing/RouteGuards';
import { FadeInUp } from './components/ui/Primitives';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Route-level code splitting with React.lazy()
const LoginScreen = lazy(() => import('./components/auth/LoginScreen'));
const CandidatePipeline = lazy(() => import('./components/Recruiter/CandidatePipeline'));
const JobCatalog = lazy(() => import('./components/Candidate/JobCatalog'));
const AIInterviewRoom = lazy(() => import('./components/Candidate/AIInterviewRoom'));
const CodeAssessment = lazy(() => import('./components/Candidate/CodeAssessment'));
const SkillGapReport = lazy(() => import('./components/Candidate/SkillGapReport'));
const MyApplications = lazy(() => import('./components/Candidate/MyApplications'));
const ProctorLiveMonitor = lazy(() => import('./components/Proctor/ProctorLiveMonitor'));
const AssessmentStudio = lazy(() => import('./components/Recruiter/AssessmentStudio'));
const NotFoundScreen = lazy(() => import('./components/ui/NotFoundScreen'));

// ─── Route Loading Fallback ──────────────────────────────────────────────────
function PageFallback() {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-600/20 border-t-indigo-600 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-purple-600/20 border-b-purple-600 animate-spin [animation-direction:reverse]" />
      </div>
      <div className="text-center space-y-0.5">
        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">SparkX OS</p>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Loading module...</p>
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
      <ToastProvider>
        <RecruitmentProvider>
          <ToastBridge />
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <Routes>
              {/* Root redirect based on auth status and role */}
              <Route path="/" element={<RootRedirect />} />

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
                {/* ─── Candidate & Recruiter Shared Module Routes ─── */}
                <Route element={<RequireRole roles={['candidate', 'recruiter']} />}>
                  <Route path="/jobs" element={<FadeInUp><JobCatalog /></FadeInUp>} />
                  <Route path="/jobs/:jobId/apply" element={<FadeInUp><JobCatalog /></FadeInUp>} />
                  <Route path="/my-applications" element={<FadeInUp><MyApplications /></FadeInUp>} />
                  <Route path="/interview" element={<FadeInUp><AIInterviewRoom /></FadeInUp>} />
                  <Route path="/interview/:candidateId" element={<FadeInUp><AIInterviewRoom /></FadeInUp>} />
                  <Route path="/assessment" element={<FadeInUp><CodeAssessment /></FadeInUp>} />
                  <Route path="/assessment/:candidateId" element={<FadeInUp><CodeAssessment /></FadeInUp>} />
                  <Route path="/skill-gap" element={<FadeInUp><SkillGapReport /></FadeInUp>} />
                  <Route path="/skill-gap/:candidateId" element={<FadeInUp><SkillGapReport /></FadeInUp>} />
                </Route>

                {/* ─── Recruiter Protected Routes ─── */}
                <Route element={<RequireRole role="recruiter" />}>
                  <Route path="/recruiter" element={<FadeInUp><CandidatePipeline /></FadeInUp>} />
                  <Route path="/recruiter/pipeline" element={<Navigate to="/recruiter" replace />} />
                  <Route path="/recruiter/jobs/:jobId" element={<FadeInUp><CandidatePipeline /></FadeInUp>} />
                  <Route path="/recruiter/candidates/:candidateId" element={<FadeInUp><CandidatePipeline /></FadeInUp>} />
                  <Route path="/recruiter/proctor" element={<FadeInUp><ProctorLiveMonitor /></FadeInUp>} />
                  <Route path="/recruiter/assessment-studio" element={<FadeInUp><AssessmentStudio defaultTab="assessment" /></FadeInUp>} />
                  <Route path="/recruiter/interview-studio" element={<FadeInUp><AssessmentStudio defaultTab="interview" /></FadeInUp>} />
                </Route>
              </Route>

              {/* ─── 404 Catch-All ─── */}
              <Route path="*" element={<NotFoundScreen />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </RecruitmentProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}