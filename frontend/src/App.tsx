import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/ToastContainer';
import { Chatbot } from './components/Chatbot';
import { useAuth } from './hooks/useAuth';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ShowDetail } from './pages/ShowDetail';
import { MovieShows } from './pages/MovieShows';
import { BookingConfirmation } from './pages/BookingConfirmation';
import { MyBookings } from './pages/MyBookings';

// Auth Guard
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const location = useLocation();

  return (
    <>
      <div className="ambient-bg" />
      <ToastContainer />
      <Chatbot />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="movies/:movieId/shows" element={<MovieShows />} />
            <Route path="shows/:showId" element={
              <RequireAuth><ShowDetail /></RequireAuth>
            } />
            <Route path="bookings/:bookingId/confirmation" element={
              <RequireAuth><BookingConfirmation /></RequireAuth>
            } />
            <Route path="bookings" element={
              <RequireAuth><MyBookings /></RequireAuth>
            } />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
