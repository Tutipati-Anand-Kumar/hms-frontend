import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { loginUser, forgotpasssword } from "../../api/authservices/authservice";
import toast from "react-hot-toast";

import {
  Eye,
  EyeOff,
  QrCode,
  ShieldPlus,
  User,
  Lock,
  Loader2,
  Mail
} from "lucide-react";

const LoginPage = () => {
 const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [fpForm, setFpForm] = useState({ email: "" });
  const [fpLoading, setFpLoading] = useState(false);
  const [fpErrors, setFpErrors] = useState({});
  const [fpServerMsg, setFpServerMsg] = useState("");

  const navigate = useNavigate();

  const mobileRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    let err = {};

    if (!form.identifier || !form.identifier.trim()) {
      err.identifier = "Enter mobile number or doctor ID.";
    } else if (!mobileRegex.test(form.identifier) && form.identifier.trim().length < 3) {
      err.identifier = "Enter valid mobile number or doctor ID.";
    }

    if (!form.password || form.password.length < 6) {
      err.password = "Password must be at least 6 characters.";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleIdentifierChange = (e) => {
    const value = e.target.value;

    // Check if the first character is a digit
    if (/^\d/.test(value)) {
      // If it starts with a digit, enforce numeric only and max 10 chars
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setForm({ ...form, identifier: numericValue });
    } else {
      // Allow alphanumeric for Doctor ID
      setForm({ ...form, identifier: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setServerMsg("");
    setLoading(true);

    try {
      const res = await loginUser(form);

      toast.success("Login successful!");

      // Redirect based on role
      const role = res.user.role;
      if (role === 'doctor') navigate("/doctor");
      else if (role === 'admin' || role === 'super-admin') navigate("/admin");
      else if (role === 'helpdesk') navigate("/helpdesk");
      else navigate("/home");

    } catch (err) {
      setServerMsg(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const validateFp = () => {
    let newErrors = {};
    if (!emailRegex.test(fpForm.email)) {
      newErrors.email = "Enter a valid email address.";
    }
    setFpErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFpSubmit = async (e) => {
    e.preventDefault();
    if (!validateFp()) return;

    setFpServerMsg("");
    setFpLoading(true);

    try {
      const res = await forgotpasssword({ email: fpForm.email });
      setFpServerMsg(res?.message || "Reset link sent.");
      toast.success("Reset link sent to your email", { duration: 2000 });
    } catch (err) {
      setFpServerMsg(err?.message || "Server error");
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center " style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="flex w-full max-w-[1300px] min-h-screen lg:min-h-[800px] lg:h-auto rounded-2xl overflow-hidden shadow-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>

        {/* ⭐ LEFT SIDE — FULL FIRST-PAGE UI */}
        <div className="hidden lg:flex flex-col w-1/2 items-start justify-center px-16 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/grid.svg')] opacity-10"></div>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <img src="/assets/logo.png" alt="" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">MSCureChain</h1>
            </div>

            <img
              src="/assets/image.png"
              className="w-[80%] max-w-[480px] rounded-2xl shadow-2xl border border-gray-700/50 mb-6 hover:scale-[1.02] transition-transform duration-500"
              alt="Health Portal"
            />

            <h2 className="text-2xl font-semibold  leading-tight mb-4">
              Your Health Data,<br />Secured & In Your Control.
            </h2>

            <p className="text-lg max-w-[480px] leading-relaxed" style={{ color: 'var(--secondary-color)' }}>
              MSCureChain is a smart healthcare platform that helps hospitals manage OPD flow, doctors create digital prescriptions, and patients book appointments without waiting in long queues.
            </p>


          </div>
        </div>

        {/* ⭐ RIGHT SIDE — LOGIN FORM */}
        <div className="w-full lg:w-1/2 flex justify-center items-center p-2 lg:p-12" style={{ backgroundColor: 'var(--card-bg)' }}>
          <div className="w-full max-w-[420px]">

            {!showForgotPassword ? (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                    Welcome Back
                  </h1>

                </div>

                {/* LOGIN FORM */}
                <form onSubmit={handleSubmit} className="space-y-6 shadow-white/50 border rounded-xl p-2" style={{ borderColor: 'var(--border-color)' }}>

                  {/* IDENTIFIER */}
                  <div>
                    <label className="text-sm font-medium mb-2.5 block" style={{ color: 'var(--secondary-color)' }}>
                      Mobile Number or Doctor ID
                    </label>

                    <div className="flex items-center border rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                      <img src="/assets/doctor.png" className="w-6 h-6 mr-2" alt="user" />
                      <input
                        type="text"
                        className="w-full bg-transparent outline-none placeholder-gray-500"
                        style={{ color: 'var(--text-color)' }}
                        placeholder="Enter mobile number or doctor ID"
                        value={form.identifier}
                        onChange={handleIdentifierChange}
                      />
                    </div>

                    {errors.identifier && (
                      <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.identifier}</p>
                    )}
                  </div>

                  {/* PASSWORD */}
                  <div className="flex items-center border rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all relative"
                    style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                  >
                    <img src="/assets/passoword.png" className="w-6 h-6 mr-2" alt="lock" />

                    <input
                      type={showPassword ? "text" : "password"}  // ✔ FIXED
                      className="w-full bg-transparent outline-none placeholder-gray-500"
                      style={{ color: 'var(--text-color)' }}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />

                    <button
                      type="button"
                      className="absolute right-4 hover:text-white transition-colors"
                      style={{ color: 'var(--secondary-color)' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>


                  {/* FORGOT PASSWORD */}
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-blue-400 text-sm hover:text-blue-300 transition-colors font-medium"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* SERVER MESSAGE */}
                  {serverMsg && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                      {serverMsg}
                    </div>
                  )}

                  {/* LOGIN BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed py-3.5 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  {/* SIGN UP */}
                  <p className="text-center text-sm" style={{ color: 'var(--secondary-color)' }}>
                    Don’t have an account?{" "}
                    <NavLink to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      Register
                    </NavLink>
                  </p>

                  {/* DIVIDER */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-grow h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                    <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--secondary-color)' }}>Or continue with</p>
                    <div className="flex-grow h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                  </div>

                  {/* QR SECTION */}
                  <button className="w-full border hover:bg-gray-800/50 rounded-xl p-4 flex items-center justify-center gap-3 transition-all group" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <QrCode className="text-blue-400" size={24} />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm font-medium" style={{ color: 'var(--text-color)' }}>Quick In-Person Access</span>
                      <span className="block text-xs" style={{ color: 'var(--secondary-color)' }}>Scan QR Code to login instantly</span>
                    </div>
                  </button>

                </form>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    Forgot Password
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>
                    Enter your email to receive a password reset link.
                  </p>
                </div>

                {/* FORGOT PASSWORD FORM */}
                <form onSubmit={handleFpSubmit} className="space-y-6 shadow-white/50 border rounded-xl p-6" style={{ borderColor: 'var(--border-color)' }}>

                  {/* EMAIL INPUT */}
                  <div>
                    <label className="text-sm font-medium mb-2.5 block" style={{ color: 'var(--secondary-color)' }}>Email Address</label>
                    <div className="flex items-center border rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                      <Mail size={20} className="mr-2" style={{ color: 'var(--text-color)' }} />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full bg-transparent outline-none placeholder-gray-500"
                        style={{ color: 'var(--text-color)' }}
                        value={fpForm.email}
                        onChange={(e) => setFpForm({ ...fpForm, email: e.target.value })}
                      />
                    </div>
                    {fpErrors.email && (
                      <p className="text-red-400 text-xs mt-1.5 ml-1">{fpErrors.email}</p>
                    )}
                  </div>

                  {/* SERVER MESSAGE */}
                  {fpServerMsg && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                      {fpServerMsg}
                    </div>
                  )}

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={fpLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed py-3.5 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    {fpLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>

                  {/* BACK TO LOGIN */}
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      className="text-blue-400 text-sm hover:text-blue-300 transition-colors font-medium"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;