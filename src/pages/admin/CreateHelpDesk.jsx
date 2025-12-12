import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { createHelpDesk, listHospitals } from "../../api/admin/adminServices";
import { Headphones, Building2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const CreateHelpDesk = () => {
    const outletContext = useOutletContext();
    const setSearchPlaceholder = outletContext?.setSearchPlaceholder;

    const [hospitals, setHospitals] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        hospitalId: "" // Selected Hospital
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (setSearchPlaceholder) setSearchPlaceholder("Search...");
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            const data = await listHospitals();
            setHospitals(data);
        } catch (err) {
            console.error("Failed to fetch hospitals", err);
        }
    };

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
            await createHelpDesk(formData);
            toast.success("Help Desk created successfully!");
            setFormData({ name: "", email: "", mobile: "", password: "", hospitalId: "" });
        } catch (err) {
            toast.error(err.message || "Creation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto md:p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 max-[600px]:text-lg" style={{ color: 'var(--text-color)' }}>
                <Headphones className="text-purple-500" /> Create Help Desk
            </h1>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-xl border shadow-lg space-y-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Assign Hospital</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <select name="hospitalId" required value={formData.hospitalId} onChange={handleChange}
                            className="w-full pl-10 pr-3 py-3 rounded-lg border outline-none appearance-none focus:border-purple-500 transition-colors"
                            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                            <option value="">Select Hospital</option>
                            {hospitals.map(h => (
                                <option key={h._id} value={h._id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Help Desk Name</label>
                    <input name="name" type="text" required placeholder="e.g. HelpDesk - Sunrise Hospital" value={formData.name} onChange={handleChange}
                        className="w-full p-3 rounded-lg border outline-none focus:border-purple-500 transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Email Address</label>
                    <input name="email" type="email" required value={formData.email} onChange={handleChange}
                        className="w-full p-3 rounded-lg border outline-none focus:border-purple-500 transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
                </div>

                <div>
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Mobile Number (10 digits)</label>
                    <input name="mobile" type="tel" required value={formData.mobile} onChange={handleChange}
                        className="w-full p-3 rounded-lg border outline-none focus:border-purple-500 transition-colors"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
                </div>

                <div className="relative">
                    <label className="block mb-2 text-sm" style={{ color: 'var(--secondary-color)' }}>Password</label>
                    <input name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange}
                        className="w-full p-3 rounded-lg border outline-none focus:border-purple-500 transition-colors pr-10"
                        style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-10 text-gray-500 hover:text-purple-500">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 max-[600px]:text-sm">
                    <Headphones size={18} /> {loading ? "Creating..." : "Create Help Desk"}
                </button>
            </form>
        </div>
    );
};

export default CreateHelpDesk;
