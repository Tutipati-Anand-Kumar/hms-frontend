import React, { useState } from "react";
import { Mail } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { forgotpasssword } from "../../api/authservices/authservice";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";

const ForgotPassword = () => {
  const [form, setForm] = useState({ email: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    let newErrors = {};
    if (!emailRegex.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setServerMsg("");
    setLoading(true);

    try {
      const res = await forgotpasssword({ email: form.email });
      setServerMsg(res?.message || "Reset link sent.");
      toast.success("Reset link sent to your email", { duration: 2000 });
    } catch (err) {
      setServerMsg(err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full  flex justify-center items-center px-4" style={{ backgroundColor: 'var(--bg-color)' }}>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md border border-gray-100 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition p-2"
          title="Go Back"
        >
          <FaArrowLeft size={18} />
        </button>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Forgot Password</h2>

        <p className="text-center text-sm mb-6" style={{ color: 'var(--secondary-color)' }}>
          Enter your email to receive a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email Input */}
          <div>
            <label className="block mb-1 text-sm" style={{ color: 'var(--secondary-color)' }}>Email Address</label>
            <div className="flex items-center border rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
              <Mail size={18} className="mr-2" style={{ color: 'var(--secondary-color)' }} />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-color)' }}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Server Message */}
          {serverMsg && (
            <p className="text-green-400 text-sm text-center">{serverMsg}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-white font-medium transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {/* Back to Login */}
          <p className="text-center text-sm mt-2" style={{ color: 'var(--secondary-color)' }}>
            Remember your password?{" "}
            <NavLink className="text-blue-400 underline" to="/login">
              Login
            </NavLink>
          </p>

        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
