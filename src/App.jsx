import React from 'react'
import { RouterProvider } from 'react-router-dom'
import "./style/App.css"
import route from './routes/Route'
import { Toaster, toast } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { io } from 'socket.io-client';
import { BASE_URL, getAuthTokens, getActiveUser } from './api/authservices/authservice';

const App = () => {
  // Global Theme Persistence
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const root = document.documentElement;
    if (savedTheme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }, []);

  // Global Date/Time Picker Trigger
  React.useEffect(() => {
    const handleInputClick = (e) => {
      // Check if target matches supported date/time input types
      if (e.target.matches('input[type="date"], input[type="time"], input[type="datetime-local"], input[type="month"]')) {
        try {
          // Attempt to show the native picker
          if (typeof e.target.showPicker === 'function') {
            e.target.showPicker();
          }
        } catch (err) {
          // Ignore potential errors (e.g., if already open or not supported)
          console.debug("showPicker not supported or failed", err);
        }
      }
    };

    window.addEventListener('click', handleInputClick);
    window.addEventListener('click', handleInputClick);
    return () => window.removeEventListener('click', handleInputClick);
  }, []);

  // Global Socket Notifications
  React.useEffect(() => {
    let socket = null;

    const connectSocket = () => {
      const user = getActiveUser();
      if (user && !socket) {
        socket = io(BASE_URL);
        socket.emit("join_room", { role: user.role, userId: user.id });

        socket.on("appointment_confirmed", (data) => {
          toast.success(data.message || "Appointment confirmed", { duration: 5000 });
        });

        socket.on("appointment_cancelled", (data) => {
          toast.error(data.message || "Appointment cancelled", { duration: 5000 });
        });
      }
    };

    const disconnectSocket = () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };

    // Connect if already logged in
    connectSocket();

    // Listen for login/logout events
    window.addEventListener("hms_login", connectSocket);
    window.addEventListener("hms_logout", disconnectSocket);

    // Explicit cleanup
    return () => {
      disconnectSocket();
      window.removeEventListener("hms_login", connectSocket);
      window.removeEventListener("hms_logout", disconnectSocket);
    };
  }, []);

  return (
    <>
      <Toaster position="top-center " />

      <AuthProvider>
        <RouterProvider router={route} />
      </AuthProvider>
    </>
  )
}

export default App