import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { CreateDoctor, listHospitals } from "../../api/admin/adminServices";
import { createDoctorByHelpdesk, getHelpDeskMe } from "../../api/helpdesk/helpdeskService";
import { getActiveUser } from "../../api/authservices/authservice";
import { UserPlus, Stethoscope, Building2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const CreateDoctor = () => {
    const outletContext = useOutletContext();
    const setSearchPlaceholder = outletContext?.setSearchPlaceholder;

    const [hospitals, setHospitals] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        specialties: "",
        qualification: "",
        experienceStart: "",
        hospitalId: "",
        consultationFee: "",
        gender: "Male",
        bio: ""
    });

    const [loading, setLoading] = useState(false);
    const [profilePic, setProfilePic] = useState("");
    const [imageSource, setImageSource] = useState("url");
    const [uploading, setUploading] = useState(false);
    const [userRole, setUserRole] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (setSearchPlaceholder) setSearchPlaceholder("Search...");
        const user = getActiveUser();

        if (user) {
            setUserRole(user.role);
            if (user.role === "helpdesk") {
                fetchHelpDeskDetails();
            } else {
                fetchHospitals();
            }
        }
    }, []);

    const fetchHelpDeskDetails = async () => {
        try {
            const data = await getHelpDeskMe();
            if (data && data.hospital) {
                setFormData(prev => ({ ...prev, hospitalId: data.hospital._id }));
                setHospitals([data.hospital]);
            }
        } catch (err) {
            console.error("Failed to fetch helpdesk details", err);
        }
    };

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
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const form = new FormData();
        form.append("photo", file);

        setUploading(true);
        try {
            const { API } = await import("../../api/authservices/authservice");
            const res = await API.post("/doctors/upload-photo", form, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setProfilePic(res.data.url);
            toast.success("Photo uploaded!");
        } catch (err) {
            console.error(err);
            toast.error("Upload failed");
        } finally {
            setUploading(false);
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
            const payload = {
                name: formData.name,
                email: formData.email,
                mobile: formData.mobile,
                password: formData.password,
                qualifications: formData.qualification.split(",").map(s => s.trim()).filter(Boolean),
                experienceStart: formData.experienceStart,
                profilePic: profilePic,
                bio: formData.bio,
                ...(userRole === "helpdesk"
                    ? {
                        specialties: formData.specialties.split(",").map(s => s.trim()).filter(Boolean),
                        consultationFee: formData.consultationFee,
                        availability: []
                    }
                    : {
                        assignHospitals: [
                            {
                                hospitalId: formData.hospitalId,
                                specialties: formData.specialties.split(",").map(s => s.trim()).filter(Boolean),
                                consultationFee: formData.consultationFee
                            }
                        ]
                    })
            };

            let res;

            if (userRole === "helpdesk") {
                res = await createDoctorByHelpdesk(payload);
            } else {
                res = await createDoctor(payload);
            }

            const doctorId = res.doctor?.user?.doctorId || "Unknown ID";

            toast.success(`Doctor created successfully! ID: ${doctorId}`, { duration: 5000 });

            setFormData({
                name: "",
                email: "",
                mobile: "",
                password: "",
                specialties: "",
                qualification: "",
                experienceStart: "",
                hospitalId: userRole === "helpdesk" ? formData.hospitalId : "",
                consultationFee: "",
                gender: "Male",
                bio: ""
            });

            setProfilePic("");
        } catch (err) {
            toast.error(err.message || "Creation failed");
        } finally {
            setLoading(false);
        }
    };

    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="max-w-7xl mx-auto md:p-6 sm:p-1">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Stethoscope className="text-blue-500 max-sm:text-[12px]" /> Add  Doctor
            </h1>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-xl border border-gray-300 shadow-lg">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PERSONAL INFO SECTION */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>

                        <div>
                            <label className="block mb-1 text-sm">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm">Mobile (10 digits)</label>
                            <input
                                name="mobile"
                                type="tel"
                                required
                                value={formData.mobile}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* PASSWORD INPUT + TOGGLE */}
                        <div className="relative">
                            <label className="block mb-1 text-sm">Password</label>
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border outline-none focus:border-blue-500 pr-10"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-gray-500 hover:text-blue-500"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm">Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border  bg-[var(--card-bg)] outline-none focus:border-blue-500"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* PROFESSIONAL INFO */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Professional Details</h3>

                        <div>
                            <label className="block mb-1 text-sm">Assign Hospital</label>

                            <div className="relative">
                                <Building2
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    size={18}
                                />

                                <select
                                    name="hospitalId"
                                    required
                                    value={formData.hospitalId}
                                    onChange={handleChange}
                                    disabled={userRole === "helpdesk"}
                                    className={`w-full pl-10 pr-3 py-3 rounded-lg border outline-none focus:border-blue-500 
                                        ${userRole === "helpdesk" ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                    <option value="">Select Hospital</option>
                                    {hospitals.map(h => (
                                        <option key={h._id} value={h._id}>
                                            {h.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm">Specialties (comma separated)</label>
                            <input
                                name="specialties"
                                type="text"
                                value={formData.specialties}
                                onChange={handleChange}
                                placeholder="Cardiology, Neurology"
                                className="w-full p-3 rounded-lg border outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm">Qualification</label>
                                <input
                                    name="qualification"
                                    type="text"
                                    value={formData.qualification}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-lg border outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm">Experience Start Date</label>
                                <input
                                    name="experienceStart"
                                    type="date"
                                    max={today}
                                    value={formData.experienceStart}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-lg outline-none border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)]"


                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm">Consultation Fee (₹)</label>
                            <input
                                name="consultationFee"
                                type="number"
                                value={formData.consultationFee}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm">Bio (About Me)</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us about yourself..."
                                className="w-full p-3 rounded-lg border outline-none focus:border-blue-500 h-24 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* PROFILE PICTURE */}
                <div className="mt-6 p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Profile Picture</h3>

                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="imageSource"
                                checked={imageSource === "url"}
                                onChange={() => setImageSource("url")}
                            />
                            <span>Image URL</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="imageSource"
                                checked={imageSource === "upload"}
                                onChange={() => setImageSource("upload")}
                            />
                            <span>Upload Photo</span>
                        </label>
                    </div>

                    {imageSource === "url" ? (
                        <input
                            type="text"
                            value={profilePic}
                            onChange={(e) => setProfilePic(e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                            className="w-full border p-3 rounded-lg outline-none focus:border-blue-500"
                        />
                    ) : (
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                            />

                            {uploading && (
                                <p className="text-blue-400 text-xs mt-2">Uploading...</p>
                            )}
                        </div>
                    )}

                    {profilePic && (
                        <div className="mt-4 flex flex-col items-center">
                            <p className="text-xs mb-2">Preview</p>
                            <img
                                src={profilePic}
                                alt="Preview"
                                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <UserPlus size={18} />
                    {loading ? "Creating..." : "Create Doctor"}
                </button>
            </form>
        </div>
    );
};

export default CreateDoctor;
