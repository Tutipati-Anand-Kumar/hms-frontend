import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
  Phone,
  ScanQrCode,
  Loader2
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { registerUser, sendOtp } from "../../api/authservices/authservice";
import toast from "react-hot-toast";

const RegisterPage = () => {
   const navigate = useNavigate();
  const location = useLocation();
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  // Enforce Consent
  const hasShownConsentToast = React.useRef(false);

  React.useEffect(() => {
    if (!location.state?.consentGiven && !hasShownConsentToast.current) {
      toast.error("Please agree to Terms & Conditions first.");
      hasShownConsentToast.current = true;
      navigate("/");
    }
  }, [location, navigate]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    otp: "",
    consentGiven: true
  });

  // VALIDATION
  const nameRegex = /^[a-zA-Z ]{3,30}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[6-9]\d{9}$/;
  const passwordRegex = /^[A-Z][A-Za-z0-9!@#]{6,}/;

  const validate = () => {
    let newErrors = {};
    if (!nameRegex.test(form.name))
      newErrors.name = "Name must be 3–20 letters.";
    if (!emailRegex.test(form.email)) newErrors.email = "Invalid email format.";
    if (!mobileRegex.test(form.mobile))
      newErrors.mobile = "Enter valid 10-digit mobile number.";
    if (!passwordRegex.test(form.password))
      newErrors.password = "Password must start with uppercase & be 6+ chars.";
    if (otpSent && !form.otp) newErrors.otp = "OTP is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SEND OTP
  const handleSendOtp = async () => {
    if (!emailRegex.test(form.email) || !mobileRegex.test(form.mobile)) {
      setErrors({
        ...errors,
        email: !emailRegex.test(form.email) ? "Enter valid email" : "",
        mobile: !mobileRegex.test(form.mobile) ? "Enter valid mobile" : "",
      });
      return;
    }

    setIsSendingOtp(true);
    setServerMsg("");

    try {
      await sendOtp({ email: form.email, mobile: form.mobile });
      toast.success("OTP sent", { duration: 1500 });

      setOtpSent(true);
      setCountdown(30);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setServerMsg(error.message || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // REGISTER
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await registerUser(form);
      toast.success("Registration Successful", { duration: 2000 });
      
     
      setTimeout(() => navigate("/login"));
    } catch (err) {
      const msg = err.response?.data?.message || "Registration Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, mobile: value });
  };

  return (
    <div className=" min-h-screen flex items-center justify-center " style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-6xl w-full h-full rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>

        {/* LEFT SIDE */}
        <div className="w-full h-[100%] lg:w-1/2 p-8 md:p-12 flex flex-col items-start justify-center text-left relative overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/grid.svg')] opacity-10"></div>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 w-full max-sm:h-[25px] max-lg:h-[25px] ">
            <div className="flex items-center max-sm:items-center max-sm:justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img src="/assets/logo.png" alt="" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-color)' }}>
                MSCureChain
              </h1>
            </div>

            {/* LARGE IMAGE */}
            <img
              src="/assets/image.png"
              alt="Register"
              className="hidden lg:block w-full max-w-[420px] h-auto object-contain rounded-2xl shadow-2xl border border-gray-700/50 mb-8 hover:scale-[1.02] transition-transform duration-500"
            />

            <h2 className="text-3xl font-bold mb-4 leading-tight" style={{ color: 'var(--text-color)' }}>
              <span className=" max-sm:hidden max-lg:hidden">
                Your Health Data, Secured.
              </span>
            </h2>

            <p className="max-sm:hidden max-lg:hidden text-base leading-relaxed max-w-md" style={{ color: 'var(--secondary-color)' }}>
              MSCureChain is a smart healthcare platform that helps hospitals manage OPD flow, doctors create digital prescriptions, and patients book appointments without waiting in long queues.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="w-full lg:w-1/2 p-1 md:p-12 flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)' }}>
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                Create Your Account
              </h2>

            </div>

            <form onSubmit={handleSubmit} className=" shadow-lg shadow-white/10 space-y-5 p-6 rounded-xl" style={{ borderColor: 'var(--border-color)', borderWidth: '1px' }}>
              {/* NAME */}
              <div>
                <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--secondary-color)' }}>
                  Full Name
                </label>
                <div className="flex items-center border rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                  <img src="/assets/user.png" className="w-6 h-7" alt="user" />
                  <input
                    type="text"
                    value={form.name}
                    placeholder="Enter full name"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-transparent outline-none ml-3 w-full placeholder-gray-500"
                    style={{ color: 'var(--text-color)' }}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-400 text-xs mt-2.5 ml-1">{errors.name}</p>
                )}
              </div>

              {/* MOBILE */}
              <div>
                <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--secondary-color)' }}>
                  Mobile Number
                </label>
                <div className="flex items-center border rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                  <img src="/assets/phone.png" className="w-6 h-6" alt="phone" />
                  <input
                    type="text"
                    value={form.mobile}
                    placeholder="Enter mobile number"
                    onChange={handleMobileChange}
                    className="bg-transparent outline-none ml-3 w-full placeholder-gray-500"
                    style={{ color: 'var(--text-color)' }}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-red-400 text-xs mt-2.5 ml-1">{errors.mobile}</p>
                )}
              </div>

              {/* EMAIL + OTP */}
              <div>
                <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--secondary-color)' }}>
                  Email Address
                </label>

                <div className="flex gap-3">
                  <div className="flex-1 flex items-center border rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                    <img src="/assets/mail.png" className="w-6 h-6 mr-2" alt="email" />
                    <input
                      type="email"
                      value={form.email}
                      placeholder="Enter email address"
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="bg-transparent outline-none w-full placeholder-gray-500"
                      style={{ color: 'var(--text-color)' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || countdown > 0}
                    className={`px-4 py-2 rounded-xl text-white font-medium transition-all min-w-[80px] flex items-center justify-center ${countdown > 0
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                      }`}
                  >
                    {isSendingOtp ? <Loader2 size={18} className="animate-spin" /> : countdown > 0 ? `${countdown}s` : "OTP"}
                  </button>
                </div>

                {errors.email && (
                  <p className="text-red-400 text-xs mt-2.5 ml-1">{errors.email}</p>
                )}
              </div>

              {/* OTP FIELD */}
              {otpSent && (
                <div>
                  <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--secondary-color)' }}>
                    Enter OTP
                  </label>
                  <div className="flex items-center border rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                    <img src="/assets/otp.png" className="w-6 h-6 mr-2" alt="otp" />
                    <input
                      type="text"
                      maxLength={6}
                      value={form.otp}
                      placeholder="Enter 6-digit OTP"
                      onChange={(e) =>
                        setForm({ ...form, otp: e.target.value })
                      }
                      className="bg-transparent outline-none ml-3 w-full placeholder-gray-500"
                      style={{ color: 'var(--text-color)' }}
                    />
                  </div>
                  {errors.otp && (
                    <p className="text-red-400 text-xs mt-2.5 ml-1">{errors.otp}</p>
                  )}
                </div>
              )}

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--secondary-color)' }}>
                  Password
                </label>

                <div className="flex items-center border rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all relative" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                  <img src="/assets/passoword.png" className="w-6 h-6 mr-2" alt="lock" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    placeholder="Create a password"
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="bg-transparent outline-none w-full pr-10 placeholder-gray-500"
                    style={{ color: 'var(--text-color)' }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 hover:text-white transition-colors"
                    style={{ color: 'var(--secondary-color)' }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="text-red-400 text-xs mt-2.5 ml-1">{errors.password}</p>
                )}
              </div>

              <button
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <p className="text-center text-sm" style={{ color: 'var(--secondary-color)' }}>
                Already have an account?{" "}
                <NavLink to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Login
                </NavLink>
              </p>
            </form>

            {/* DIVIDER */}
            <div className="flex items-center gap-4 my-6">
              <div className="grow h-px" style={{ backgroundColor: 'var(--border-color)' }} />
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--secondary-color)' }}>Or</p>
              <div className="grow h-px" style={{ backgroundColor: 'var(--border-color)' }} />
            </div>

            {/* QR CODE BOX */}
            <button className="w-full border hover:bg-gray-800/50 rounded-xl p-4 flex items-center justify-center gap-3 transition-all group" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <ScanQrCode className="text-blue-400" size={24} />
              </div>
              <div className="text-left">
                <span className="block text-sm font-medium" style={{ color: 'var(--text-color)' }}>Quick In-Person Access</span>
                <span className="block text-xs" style={{ color: 'var(--secondary-color)' }}>Scan QR Code to register instantly</span>
              </div>
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default RegisterPage;
