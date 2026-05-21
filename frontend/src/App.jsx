import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { GuestRoute, ProtectedRoute } from './components/RouteGuards.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import KitchenHomePage from './pages/KitchenHomePage.jsx';
import WorkspacePage from './pages/WorkspacePage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={(
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          )}
        />
        <Route
          path="/app"
          element={(
            <ProtectedRoute>
              <KitchenHomePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app/cook"
          element={(
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/app/cook/:sessionId"
          element={(
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
