import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { resetPassword } from "../../api/authservices/authservice";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPwd: "", confirmPwd: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.newPwd || form.newPwd.length < 6)
      e.newPwd = "Password must be at least 6 characters.";
    if (form.newPwd !== form.confirmPwd)
      e.confirmPwd = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerMsg("");

    try {
      await resetPassword({ token, newPwd: form.newPwd });
      setServerMsg("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setServerMsg(err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center px-4" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="w-[420px] p-8 rounded-xl shadow-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>

        <h2 className="text-3xl font-semibold text-center mb-6" style={{ color: 'var(--text-color)' }}>
          Set New Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* New Password */}
          <div>
            <label className="text-sm" style={{ color: 'var(--secondary-color)' }}>New Password</label>
            <div className="flex items-center border rounded-lg px-3 py-2 mt-1 relative" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
              <Lock size={18} className="mr-2" style={{ color: 'var(--secondary-color)' }} />
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Enter new password"
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-color)' }}
                value={form.newPwd}
                onChange={(e) => setForm({ ...form, newPwd: e.target.value })}
              />
              <span
                className="absolute right-3 cursor-pointer"
                style={{ color: 'var(--secondary-color)' }}
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            {errors.newPwd && (
              <p className="text-red-500 text-xs mt-1">{errors.newPwd}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm" style={{ color: 'var(--secondary-color)' }}>Confirm Password</label>
            <div className="flex items-center border rounded-lg px-3 py-2 mt-1 relative" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
              <Lock size={18} className="mr-2" style={{ color: 'var(--secondary-color)' }} />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm password"
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-color)' }}
                value={form.confirmPwd}
                onChange={(e) =>
                  setForm({ ...form, confirmPwd: e.target.value })
                }
              />
              <span
                className="absolute right-3 cursor-pointer"
                style={{ color: 'var(--secondary-color)' }}
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            {errors.confirmPwd && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPwd}</p>
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
            {loading ? "Saving..." : "Save New Password"}
          </button>

          {/* Back to login */}
          <p className="text-center text-sm mt-2" style={{ color: 'var(--secondary-color)' }}>
            Back to{" "}
            <NavLink to="/login" className="text-blue-400 underline">
              Login
            </NavLink>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
