import React from 'react';
import { Zap, CheckCircle, Stethoscope, Smartphone, Building } from 'lucide-react';
import calendarIcon from '../../assets/icons/calendar.png';
import clockIcon from '../../assets/icons/clock.png';
import documentIcon from '../../assets/icons/document.png';
import shieldIcon from '../../assets/icons/shield.png';
import brainIcon from '../../assets/icons/brain.png';
import usersIcon from '../../assets/icons/users.png';
import arrowRightIcon from '../../assets/icons/arrow_right.png';
import { useNavigate } from 'react-router-dom';

const HeroCard = () => {
    let navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]  md:py-24 relative overflow-hidden transition-colors duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal-500 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex  mt-5 items-center gap-2 bg-[var(--card-bg)]/50 backdrop-blur-sm rounded-full px-5 py-2 mb-8 border border-[var(--border-color)] shadow-sm">

                        <span className="text-sm font-medium text-[var(--secondary-color)]">AI-Powered Healthcare Platform</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        <span className="text-blue-500 dark:text-blue-400">MS</span>
                        <span className="text-green-500">CureChain</span>
                    </h1>

                    <p className="text-2xl md:text-3xl text-[var(--secondary-color)] mb-8 max-w-4xl mx-auto font-light">
                        Revolutionizing Healthcare with AI-Powered OPD & Appointment Management
                    </p>

                    <p className="text-lg text-[var(--secondary-color)]/80 mb-12 max-w-3xl mx-auto">
                        Join thousands of hospitals, doctors, and patients experiencing seamless digital healthcare across India
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate("/login")}
                            className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-lg text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/50">
                            <Building className="w-5 h-5" />
                            Start Free Trial for Hospitals

                        </button>

                        <button
                            // onClick={() => navigate("/register")}
                            onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}

                            className="group bg-[var(--card-bg)]/80 hover:bg-[var(--card-bg)] backdrop-blur-sm text-[var(--text-color)] font-semibold py-4 px-8 rounded-lg text-lg border border-[var(--border-color)] hover:border-[var(--secondary-color)] flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md">
                            <Smartphone className="w-5 h-5 text-[var(--text-color)]" />
                            Book Appointment as Patient
                        </button>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    <FeatureCard
                        icon={calendarIcon}
                        title="Smart Appointment Booking"
                        description="Book doctor appointments online, choose available slots, and receive instant confirmation"
                        color="blue"
                    />
                    <FeatureCard
                        icon={brainIcon}
                        title="AI-Powered Prescriptions"
                        description="AI suggests prescriptions based on symptoms, saving doctors time and improving accuracy"
                        color="purple"
                    />
                    <FeatureCard
                        icon={clockIcon}
                        title="Queue Management"
                        description="Intelligent OPD flow prediction reduces waiting time and organizes patient flow"
                        color="green"
                    />
                    <FeatureCard
                        icon={documentIcon}
                        title="Digital Prescriptions"
                        description="No more lost papers. All prescriptions stored digitally and accessible anytime"
                        color="teal"
                    />
                    <FeatureCard
                        icon={shieldIcon}
                        title="Secure Medical History"
                        description="Complete treatment history in one place, accessible to authorized doctors only"
                        color="red"
                    />
                    <FeatureCard
                        icon={usersIcon}
                        title="Unified Platform"
                        description="One system for patients, doctors, and hospitals - seamless healthcare experience"
                        color="orange"
                    />
                </div>

                {/* Stats Section */}
                <div className="bg-[var(--card-bg)]/80 backdrop-blur-sm rounded-2xl p-8 mb-16 border border-[var(--border-color)] shadow-2xl transition-colors duration-300">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-[var(--text-color)] mb-2">
                            Transforming Indian Healthcare
                        </h2>
                        <p className="text-[var(--secondary-color)]">Trusted by healthcare providers across the country</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatCard
                            number="90%"
                            label="Reduction in Waiting Time"
                            icon={clockIcon}
                        />
                        <StatCard
                            number="100+"
                            label="Hospitals Trust Us"
                            icon={<Building className="w-6 h-6 text-blue-500" />}
                            isComponent={true}
                        />
                        <StatCard
                            number="50K+"
                            label="Patients Served"
                            icon={usersIcon}
                        />
                        <StatCard
                            number="24/7"
                            label="AI Support Available"
                            icon={brainIcon}
                        />
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-3 bg-[var(--bg-color)]/50 rounded-lg px-4 py-2 border border-[var(--border-color)]">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-[var(--secondary-color)]">HIPAA Compliant</span>
                        </div>
                        <div className="flex items-center gap-3 bg-[var(--bg-color)]/50 rounded-lg px-4 py-2 border border-[var(--border-color)]">
                            <ShieldCheckIcon />
                            <span className="text-[var(--secondary-color)]">100% Data Secure</span>
                        </div>
                        <div className="flex items-center gap-3 bg-[var(--bg-color)]/50 rounded-lg px-4 py-2 border border-[var(--border-color)]">
                            <Stethoscope className="w-5 h-5 text-purple-500" />
                            <span className="text-[var(--secondary-color)]">Medical Grade Security</span>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-[var(--text-color)] mb-4">
                        Ready to Transform Your Healthcare Experience?
                    </h3>
                    <p className="text-[var(--secondary-color)] mb-15 max-w-2xl mx-auto text-lg">
                        Join MSCureChain today and be part of India's digital healthcare revolution.
                        Perfect for Tier-2 and Tier-3 cities expanding nationwide.
                    </p>




                </div>
            </div>
        </div>
    );
};

// Helper for ShieldCheck since we have an image for it but used it in badges too
const ShieldCheckIcon = () => (
    <img src={shieldIcon} alt="Secure" className="w-5 h-5" />
);

// Feature Card Component
const FeatureCard = ({ icon, title, description, color }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        green: 'bg-green-500/10 text-green-500 border-green-500/20',
        teal: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
        red: 'bg-red-500/10 text-red-500 border-red-500/20',
        orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    };

    return (
        <div className="bg-[var(--card-bg)] backdrop-blur-sm rounded-xl p-6 border border-[var(--border-color)] hover:border-[var(--secondary-color)] hover:bg-[var(--card-bg)]/90 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-5 border transition-transform group-hover:scale-110`}>
                <img src={icon} alt={title} className="w-8 h-8 object-contain" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-color)] mb-3">{title}</h3>
            <p className="text-[var(--secondary-color)]">{description}</p>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ number, label, icon, isComponent = false }) => (
    <div className="text-center bg-[var(--bg-color)]/40 rounded-xl p-6 border border-[var(--border-color)] hover:border-[var(--secondary-color)] transition-colors shadow-sm">
        <div className="flex justify-center mb-3">
            {isComponent ? icon : <img src={icon} alt={label} className="w-8 h-8 object-contain" />}
        </div>
        <div className="text-4xl font-bold text-[var(--text-color)] mb-2">{number}</div>
        <div className="text-[var(--secondary-color)] font-medium">{label}</div>
    </div>
);

export default HeroCard;