import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { createAdmin } from "../../api/admin/adminServices";
import { UserPlus, Shield, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const CreateAdmin = () => {
    const outletContext = useOutletContext();
    const setSearchPlaceholder = outletContext?.setSearchPlaceholder;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (setSearchPlaceholder) setSearchPlaceholder("Search...");
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "mobile") {
            if (/^\d{0,10}$/.test(value)) {
                setFormData({ ...formData, [name]: value });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.mobile.length !== 10) {
            toast.error("Mobile number must be exactly 10 digits.");
            return;
        }

        setLoading(true);
        try {
            await createAdmin(formData);
            toast.success("Admin created successfully!");
            setFormData({ name: "", email: "", mobile: "", password: "" });
        } catch (err) {
            toast.error(err.message || "Creation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto md:p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 max-[600px]:text-lg" style={{ color: 'var(--text-color)' }}>
                <Shield className="text-green-500" /> Create New Admin
            </h1>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-xl border shadow-lg space-y-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Full Name</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border outline-none focus:border-green-500 transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border outline-none focus:border-green-500 transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Mobile Number (10 digits)</label>
                    <input
                        type="tel"
                        name="mobile"
                        required
                        value={formData.mobile}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border outline-none focus:border-green-500 transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                </div>

                <div className="relative">
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Password</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border outline-none focus:border-green-500 transition-colors pr-10"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-10 text-gray-500 hover:text-green-500">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 max-[600px]:text-sm"
                >
                    <UserPlus size={18} /> {loading ? "Creating..." : "Create Admin"}
                </button>
            </form>
        </div>
    );
};

export default CreateAdmin;
