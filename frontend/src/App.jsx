import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RecruitmentProvider, onContextToast } from './context/RecruitmentContext';
import { ToastProvider, useToast } from './components/ui/Toast';
import LoginScreen from './components/auth/LoginScreen';
import CandidatePipeline from './components/Recruiter/CandidatePipeline';
import JobCatalog from './components/Candidate/JobCatalog';
import AIInterviewRoom from './components/Candidate/AIInterviewRoom';
import CodeAssessment from './components/Candidate/CodeAssessment';
import SkillGapReport from './components/Candidate/SkillGapReport';
import MyApplications from './components/Candidate/MyApplications';
import ProctorLiveMonitor from './components/Proctor/ProctorLiveMonitor';
import AppLayout from './components/layout/AppLayout';
import { RequireAuth, RequireRole, RequirePublic, RootRedirect } from './components/routing/RouteGuards';
import NotFoundScreen from './components/ui/NotFoundScreen';
import { FadeInUp } from './components/ui/Primitives';

import ErrorBoundary from './components/ui/ErrorBoundary';

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
              {/* ─── Candidate Protected Routes ─── */}
              <Route element={<RequireRole role="candidate" />}>
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
              </Route>
            </Route>

            {/* ─── 404 Catch-All ─── */}
            <Route path="*" element={<NotFoundScreen />} />
          </Routes>
          </ErrorBoundary>
        </RecruitmentProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}