import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { API } from "../../api/authservices/authservice";
import { Building2, MapPin, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const CreateHospital = () => {
    const outletContext = useOutletContext();
    const setSearchPlaceholder = outletContext?.setSearchPlaceholder;

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
        pincode: "",
        establishedYear: "",
        website: "",
        operatingHours: "24/7",
        numberOfBeds: "",
        ICUBeds: "",
        numberOfDoctors: "",
        ambulanceAvailability: true,
        rating: "4.5",
        location: { lat: "", lng: "" },
        specialities: [],
        services: []
    });

    const [tempSpecialty, setTempSpecialty] = useState("");
    const [tempService, setTempService] = useState("");

    useEffect(() => {
        if (setSearchPlaceholder) setSearchPlaceholder("Search...");
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone") {
            if (/^\d{0,10}$/.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const addItem = (field, value, setter) => {
        if (!value.trim()) return;
        setFormData(prev => ({ ...prev, [field]: [...prev[field], value] }));
        setter("");
    };

    const removeItem = (field, index) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.phone.length !== 10) {
            toast.error("Phone number must be exactly 10 digits.");
            return;
        }

        setLoading(true);
        try {
            const res = await API.post("/admin/create-hospital", formData);
            const hospitalId = res.data.hospital?.hospitalId || "Unknown ID";
            toast.success(`Hospital created successfully! ID: ${hospitalId}`, { duration: 5000 });

            setFormData({
                name: "", address: "", phone: "", email: "", pincode: "",
                establishedYear: "", website: "", operatingHours: "24/7",
                numberOfBeds: "", ICUBeds: "", numberOfDoctors: "",
                ambulanceAvailability: true, rating: "4.5",
                location: { lat: "", lng: "" }, specialities: [], services: []
            });
        } catch (err) {
            toast.error(err.response?.data?.message || "Creation failed");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        borderColor: 'var(--border-color)'
    };

    return (
        <div className="max-w-6xl mx-auto md:p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 max-[600px]:text-lg" style={{ color: 'var(--text-color)' }}>
                <Building2 className="text-orange-500" /> Create New Hospital
            </h1>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-xl border shadow-lg space-y-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>

                {/* Basic Info */}
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 max-[600px]:text-md" style={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input name="name" placeholder="Hospital Name" required value={formData.name} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                        <input name="email" type="email" placeholder="Email Address" required value={formData.email} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                        <input name="phone" type="tel" placeholder="Phone Number (10 digits)" required value={formData.phone} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                        <input name="website" placeholder="Website URL" value={formData.website} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                        <input name="establishedYear" type="number" placeholder="Established Year" value={formData.establishedYear} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 max max-[600px]:text-md" style={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input name="address" placeholder="Full Address" required value={formData.address} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors md:col-span-2" style={inputStyle} />
                        <input name="pincode" placeholder="Pincode" required value={formData.pincode} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                        <div className="grid grid-cols-2 gap-4">
                            <input name="location.lat" placeholder="Latitude" value={formData.location.lat} onChange={handleChange}
                                className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                            <input name="location.lng" placeholder="Longitude" value={formData.location.lng} onChange={handleChange}
                                className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                        </div>
                    </div>
                </div>

                {/* Infrastructure */}
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 max-[600px]:text-md" style={{ color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>Infrastructure & Capacity</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <input name="numberOfBeds" type="number" placeholder="Total Beds" value={formData.numberOfBeds} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                        <input name="ICUBeds" type="number" placeholder="ICU Beds" value={formData.ICUBeds} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                        <input name="numberOfDoctors" type="number" placeholder="No. of Doctors" value={formData.numberOfDoctors} onChange={handleChange}
                            className="w-full p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle} />
                        <div className="flex items-center gap-2 px-4 rounded-lg border" style={{ ...inputStyle, height: '50px' }}>
                            <input
                                type="checkbox"
                                checked={formData.ambulanceAvailability}
                                onChange={(e) => setFormData({ ...formData, ambulanceAvailability: e.target.checked })}
                                className="w-5 h-5 accent-blue-600"
                            />
                            <label>Ambulance Available</label>
                        </div>
                    </div>
                </div>

                {/* Specialties & Services */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Specialties */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 max-[600px]:text-md" style={{ color: 'var(--text-color)' }}>Specialties</h3>
                        <div className="flex gap-2 mb-3">
                            <input
                                value={tempSpecialty}
                                onChange={(e) => setTempSpecialty(e.target.value)}
                                placeholder="Add Specialty"
                                className="flex-1 p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle}
                            />
                            <button type="button" onClick={() => addItem('specialities', tempSpecialty, setTempSpecialty)} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.specialities.map((item, idx) => (
                                <span key={idx} className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    {item} <button type="button" onClick={() => removeItem('specialities', idx)}><Trash2 size={14} /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 max-[600px]:text-md" style={{ color: 'var(--text-color)' }}>Services</h3>
                        <div className="flex gap-2 mb-3">
                            <input
                                value={tempService}
                                onChange={(e) => setTempService(e.target.value)}
                                placeholder="Add Service"
                                className="flex-1 p-3 rounded-lg border outline-none focus:border-orange-500 transition-colors" style={inputStyle}
                            />
                            <button type="button" onClick={() => addItem('services', tempService, setTempService)} className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700">
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.services.map((item, idx) => (
                                <span key={idx} className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    {item} <button type="button" onClick={() => removeItem('services', idx)}><Trash2 size={14} /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 max-[600px]:text-sm">
                    <Building2 size={20} /> {loading ? "Creating Hospital..." : "Create Hospital"}
                </button>
            </form>
        </div>
    );
};

export default CreateHospital;
