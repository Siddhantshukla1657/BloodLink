// ──────────────────────────────────────────────
//  BloodLink — App Root with Routing
// ──────────────────────────────────────────────
import { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';

import { Header }           from './components/layout/Header';
import { Sidebar }          from './components/layout/Sidebar';
import { DashboardPage }    from './pages/DashboardPage';
import { NewRequestPage }   from './pages/NewRequestPage';
import { RequestDetailPage} from './pages/RequestDetailPage';
import { DonorRespondPage } from './pages/DonorRespondPage';
import { RequestsListPage } from './pages/RequestsListPage';
import { LoadingSpinner }   from './components/ui/LoadingSpinner';
import { useRequests }      from './hooks/useRequest';
import { SearchIcon }       from './components/ui/Icons';

import './index.css';
import './App.css';

function AppRoutes() {
  const {
    requests,
    stats,
    donors,
    hospitals,
    loading,
    error,
    addRequest,
    respondToDonor,
    cancelRequest,
    addDonor,
    addHospital
  } = useRequests();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeCount = requests.filter(r =>
    ['pending', 'tier1_notified', 'tier2_notified'].includes(r.state)
  ).length;

  if (loading) {
    return <LoadingSpinner fullPage message="Connecting to Supabase..." />;
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: '16px',
        color: 'var(--color-text-muted)', padding: '40px',
        textAlign: 'center',
      }}>
        <div style={{ color: 'var(--color-critical)' }}>
          <SearchIcon size={48} />
        </div>
        <h2 style={{ color: 'var(--color-text-primary)' }}>Could not connect to Supabase</h2>
        <p style={{ maxWidth: '480px' }}>
          Make sure <code>.env.local</code> contains valid{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> values,
          then restart the dev server.
        </p>
        <pre style={{
          background: 'var(--color-surface)', padding: '12px 20px',
          borderRadius: '8px', fontSize: '13px', maxWidth: '600px',
          textAlign: 'left', color: 'var(--color-critical)',
        }}>
          {error}
        </pre>
        <button className="btn btn--primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Header
        onMenuToggle={() => setSidebarOpen(o => !o)}
        sidebarOpen={sidebarOpen}
      />
      <div className="app-layout">
        <Sidebar
          activeRequests={activeCount}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-content">
          <Routes>
            {/* Dashboard */}
            <Route
              path="/"
              element={
                <DashboardPage
                  requests={requests}
                  stats={stats}
                  donors={donors}
                  hospitals={hospitals}
                  onAddDonor={addDonor}
                  onAddHospital={addHospital}
                />
              }
            />


            {/* All Requests */}
            <Route
              path="/requests"
              element={<RequestsListPage requests={requests} />}
            />

            {/* New Request */}
            <Route
              path="/requests/new"
              element={<NewRequestPage onAddRequest={addRequest} />}
            />

            {/* Request Detail */}
            <Route
              path="/requests/:id"
              element={
                <RequestDetailRoute
                  requests={requests}
                  onCancel={cancelRequest}
                />
              }
            />

            {/* Donor Respond */}
            <Route
              path="/donor/:requestId/:donorId"
              element={
                <DonorRespondRoute
                  requests={requests}
                  onRespond={respondToDonor}
                />
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

function RequestDetailRoute({
  requests,
  onCancel,
}: {
  requests: ReturnType<typeof useRequests>['requests'];
  onCancel: (id: string) => Promise<void>;
}) {
  const { id } = useParams<{ id: string }>();
  const req = requests.find(r => r.id === id);
  if (!req) return (
    <div className="page-content" style={{ paddingTop: '80px', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
        <SearchIcon size={48} />
      </div>
      <h2>Request not found</h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>ID: {id}</p>
    </div>
  );
  return <RequestDetailPage request={req} onCancel={onCancel} />;
}

function DonorRespondRoute({
  requests,
  onRespond,
}: {
  requests: ReturnType<typeof useRequests>['requests'];
  onRespond: (requestId: string, donorId: string, accepted: boolean) => Promise<void>;
}) {
  const { requestId, donorId } = useParams<{ requestId: string; donorId: string }>();
  const req = requests.find(r => r.id === requestId);
  const donor = req?.notifiedDonors.find(d => d.id === donorId);

  if (!req || !donor) {
    return (
      <div className="donor-page">
        <div className="donor-page__inner" style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{ display: 'inline-flex', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            <SearchIcon size={48} />
          </div>
          <h2>Request or donor not found</h2>
        </div>
      </div>
    );
  }

  return (
    <DonorRespondPage
      request={req}
      donor={donor}
      onRespond={onRespond}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
