import React from 'react';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className="border-t transition-colors  duration-300"
            style={{
                backgroundColor: 'var(--card-bg)',
                color: 'var(--secondary-color)',
                borderColor: 'var(--border-color)'
            }}
        >
            {/* Main Footer Content */}
            <div className="max-w-7xl h-[24%] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* About Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className=" p-2 rounded-lg">
                                <img className='w-10 h-10' src="\assets\logo.png" alt="" />
                            </div>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>MSCureChain</h3>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--secondary-color)' }}>
                            Providing quality healthcare services with compassion and excellence.
                            Your health and well-being are our top priorities.
                        </p>
                        <div className="flex space-x-3">
                            <a
                                href="https://www.facebook.com/people/M-Techhive/pfbid02aehgvVvXUYcTmT4HUYZfLGzSNjJSTJkQ6FCG7sAuj6SRPR4u8wjif1RN24pBhof6l/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full transition-all duration-300 transform hover:scale-110 hover:bg-blue-600"
                                style={{ backgroundColor: 'var(--bg-color)' }}
                                aria-label="Facebook"
                            >
                                <Facebook size={18} />
                            </a>
                            <a
                                href="https://x.com/MSTECHHIVE"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full transition-all duration-300 transform hover:scale-110 hover:bg-blue-600"
                                style={{ backgroundColor: 'var(--bg-color)' }}
                                aria-label="Twitter"
                            >
                                <Twitter size={18} />
                            </a>
                            <a
                                href="https://www.linkedin.com/in/ms-tech-hive-08aa7a378/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full transition-all duration-300 transform hover:scale-110 hover:bg-blue-600"
                                style={{ backgroundColor: 'var(--bg-color)' }}
                                aria-label="LinkedIn"
                            >
                                <Linkedin size={18} />
                            </a>
                            <a
                                href="https://www.instagram.com/mstechhive/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full transition-all duration-300 transform hover:scale-110 hover:bg-blue-600"
                                style={{ backgroundColor: 'var(--bg-color)' }}
                                aria-label="Instagram"
                            >
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200 flex items-center group">
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                                    About Us
                                </a>
                            </li>

                            <li>
                                <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200 flex items-center group">
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                                    Appointments
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200 flex items-center group">
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                                    Emergency Care
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Our Services</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200 flex items-center group">
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                                    General Medicine
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200 flex items-center group">
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                                    Cardiology
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200 flex items-center group">
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                                    Pediatrics
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200 flex items-center group">
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                                    Orthopedics
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200 flex items-center group">
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-blue-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                                    Laboratory Services
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Contact Us</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start space-x-3 group">
                                <MapPin size={18} className="text-blue-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                                <a
                                    href="https://maps.app.goo.gl/xuJKp9urXsuoBeab9"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm hover:text-blue-400 transition-colors duration-200"
                                >
                                    View Location
                                </a>
                            </li>
                            <li className="flex items-center space-x-3 group">
                                <Phone size={18} className="text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                                <a href="tel:+919032223352" className="text-sm hover:text-blue-400 transition-colors duration-200">
                                    +91 9032223352
                                </a>
                            </li>
                            <li className="flex items-center space-x-3 group">
                                <Mail size={18} className="text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                                <a href="mailto:info@mstechhive.com" className="text-sm hover:text-blue-400 transition-colors duration-200">
                                    info@mstechhive.com
                                </a>
                            </li>
                        </ul>

                        {/* Emergency Badge */}
                        <div className="mt-4 bg-red-600/20 border border-red-600/50 rounded-lg p-3">
                            <p className="text-red-400 font-semibold text-sm">24/7 Emergency</p>
                            <p className="text-red-300 text-xs mt-1">Call: +91 9032223352</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>
                            © {currentYear} MS Tech Hive - Hospital Management System. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200" style={{ color: 'var(--secondary-color)' }}>
                                Privacy Policy
                            </a>
                            <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200" style={{ color: 'var(--secondary-color)' }}>
                                Terms of Service
                            </a>
                            <a href="#" className="text-sm hover:text-blue-400 transition-colors duration-200" style={{ color: 'var(--secondary-color)' }}>
                                Cookie Policy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;