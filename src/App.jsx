import React from 'react'
import { RouterProvider } from 'react-router-dom'
import "./style/App.css"
import route from './routes/Route'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'

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
    return () => window.removeEventListener('click', handleInputClick);
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