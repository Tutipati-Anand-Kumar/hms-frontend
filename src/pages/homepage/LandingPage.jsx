import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Activity, Database, Server, Code, Globe, CheckCircle, X, Sun, Moon } from "lucide-react";
import logo from "../../assets/logo.png";
import HeroCard from "../../components/cards/HeroCard";
import Footer from "../../components/footer/Footer";


const LandingPage = () => {
    const navigate = useNavigate();
    const [consent, setConsent] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.setAttribute("data-theme", "dark");
        } else {
            root.removeAttribute("data-theme");
        }
        localStorage.setItem("theme", theme);

        // Dispatch custom event for other components to listen
        window.dispatchEvent(new Event('themeChange'));
    }, [theme]);

    // Listen for theme changes from other components
    useEffect(() => {
        const handleThemeChange = () => {
            const currentTheme = localStorage.getItem("theme") || "light";
            setTheme(currentTheme);
        };

        window.addEventListener('themeChange', handleThemeChange);
        window.addEventListener('storage', handleThemeChange);

        return () => {
            window.removeEventListener('themeChange', handleThemeChange);
            window.removeEventListener('storage', handleThemeChange);
        };
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const handleRegisterClick = () => {
        if (consent) {
            navigate("/register", { state: { consentGiven: true } });
        }
    };

    return (
        <div className="min-h-screen  p-2 selection:bg-blue-500/30" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
            {/* Navbar */}
            <nav className="border-b backdrop-blur-md sticky top-0 z-50 transition-colors"
                style={{ backgroundColor: 'var(--navbar-bg)', borderColor: 'var(--border-color)' }}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                        <span className="text-xl  mr-10 font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            MSCureChain
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-3  rounded-lg transition-all hover:bg-blue-500/10"
                            style={{ color: 'var(--secondary-color)' }}
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button
                            onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
                            className="bg-blue-600 hover:bg-blue-700 max-sm:text-[10px] text-white px-2 py-1 rounded-lg text-sm font-medium transition-all"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <HeroCard></HeroCard>

            {/* Theme-based Platform Preview */}
            <div className="w-full max-w-6xl  mx-auto -mt-10 mb-12 px-6 relative z-20">
                <img
                    src={theme === 'dark' ? '/assets/black.jpeg' : '/assets/landing.jpeg'}
                    alt="MSCureChain Dashboard Preview"
                    className="w-full rounded-2xl shadow-2xl border-4]"
                />
            </div>


            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 radial-gradient-center pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 py-10 lg:py-10 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
                            <ShieldCheck size={14} />
                            <span>Secure & Private Healthcare</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            Your Health Data, <br />
                            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                Secured & Accessible.
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: 'var(--secondary-color)' }}>
                            A comprehensive Hospital Management System built for privacy, efficiency, and seamless care coordination.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                        <FeatureCard
                            icon={Lock}
                            title="Privacy First"
                            desc="End-to-end encryption for all patient records and sensitive data."
                        />
                        <FeatureCard
                            icon={Activity}
                            title="Real-time Updates"
                            desc="Instant synchronization of appointments, prescriptions, and vitals."
                        />
                        <FeatureCard
                            icon={Database}
                            title="Unified Records"
                            desc="A single source of truth for patient history across all departments."
                        />
                    </div>

                    {/* Tech Stack */}

                    {/* Consent & CTA Section */}
                    <div id="get-started" className="max-w-md mx-auto border rounded-2xl p-5 shadow-2xl relative overflow-hidden group"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                        <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--text-color)' }}>Join MSCureChain</h3>
                        <p className="text-center text-sm mb-8" style={{ color: 'var(--secondary-color)' }}>
                            Create your account to access secure health services.
                        </p>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-start gap-3 p-4 rounded-lg border"
                                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
                                <div className="pt-0.5">
                                    <input
                                        type="checkbox"
                                        id="consent"
                                        checked={consent}
                                        onChange={(e) => setConsent(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="consent" className="text-sm cursor-pointer select-none" style={{ color: 'var(--secondary-color)' }}>
                                    I agree to the <button onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Terms & Conditions</button> and Privacy Policy. I understand that my data will be securely stored.
                                </label>
                            </div>

                            <button
                                onClick={handleRegisterClick}
                                disabled={!consent}
                                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
                                        ${consent
                                        ? "bg-blue-400 hover:bg-blue-700 text-white translate-y-0"
                                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                <span>Create Account</span>
                                {consent && <CheckCircle size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />

            {/* Terms Modal */}
            {showTerms && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>Terms & Conditions</h2>
                            <button
                                onClick={() => setShowTerms(false)}
                                className="transition-colors p-1 rounded-lg hover:bg-gray-700/20"
                                style={{ color: 'var(--secondary-color)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto text-sm space-y-4 leading-relaxed custom-scrollbar" style={{ color: 'var(--secondary-color)' }}>
                            <p><strong>1. Acceptance of Terms:</strong> By accessing and using MSCureChain, you agree to be bound by these Terms and Conditions.</p>
                            <p><strong>2. Privacy & Data Security:</strong> We prioritize your privacy. Your medical data is encrypted and stored securely. We do not share your personal information with third parties without your explicit consent, except as required by law.</p>
                            <p><strong>3. User Responsibilities:</strong> You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and up-to-date information during registration.</p>
                            <p><strong>4. Medical Disclaimer:</strong> MSCureChain is a management tool and does not provide medical advice. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
                            <p><strong>5. Service Availability:</strong> We strive to ensure 24/7 availability but do not guarantee uninterrupted access due to maintenance or unforeseen technical issues.</p>
                            <p><strong>6. Termination:</strong> We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.</p>
                            <div className="mt-8 pt-4 border-t text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--secondary-color)' }}>
                                Last updated: November 2025
                            </div>
                        </div>
                        <div className="p-4 border-t rounded-b-2xl flex justify-end"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                            <button
                                onClick={() => { setShowTerms(false); setConsent(true); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                I Understand & Agree
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="border p-6 rounded-2xl transition-colors duration-300 group hover:shadow-lg"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
            <Icon size={24} className="text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--secondary-color)' }}>{desc}</p>
    </div>
);

const TechItem = ({ icon: Icon, label }) => (
    <div className="flex flex-col items-center gap-2">
        <Icon size={32} style={{ color: 'var(--secondary-color)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--secondary-color)' }}>{label}</span>
    </div>
);

export default LandingPage;
