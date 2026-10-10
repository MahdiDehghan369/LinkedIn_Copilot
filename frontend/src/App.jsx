import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ApiError } from './api/client.js';
import { queryKeys } from './api/queryKeys.js';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { GuestRoute } from './routes/GuestRoute.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AIAssistantPage } from './pages/AIAssistantPage.jsx';
import { PostsPage } from './pages/PostsPage.jsx';
import { PostEditorPage } from './pages/PostEditorPage.jsx';
import { IdeasPage } from './pages/IdeasPage.jsx';
import { CalendarPage } from './pages/CalendarPage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { LinkedInSettingsPage } from './pages/LinkedInSettingsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AISettingsPage } from './pages/AISettingsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

/**
 * A 401 on any query other than the session check itself means the
 * session expired mid-use (it was valid a moment ago, or the user
 * wouldn't have reached a protected page). Clearing the cached `me` data
 * flips `isAuthenticated` to false, and `ProtectedRoute` redirects to
 * `/login` on its next render — centralized here instead of every hook
 * needing its own 401 handling.
 */
const queryCache = new QueryCache({
  onError: (error, query) => {
    const isMeQuery = query.queryKey[0] === 'me';
    if (!isMeQuery && error instanceof ApiError && error.status === 401) {
      query.client.setQueryData(queryKeys.me, null);
    }
  },
});

const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                }
              />

              <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
              <Route path="/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
              <Route path="/posts/new" element={<ProtectedRoute><PostEditorPage /></ProtectedRoute>} />
              <Route path="/posts/:id" element={<ProtectedRoute><PostEditorPage /></ProtectedRoute>} />
              <Route path="/ideas" element={<ProtectedRoute><IdeasPage /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/linkedin" element={<ProtectedRoute><LinkedInSettingsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings/ai" element={<ProtectedRoute><AISettingsPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
