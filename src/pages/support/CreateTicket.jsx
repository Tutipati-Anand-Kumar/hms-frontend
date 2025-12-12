import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../../api/support/supportService';
import { ArrowLeft, Image as ImageIcon, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateTicket = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        type: 'feedback', // default first option
        message: ''
    });
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length + files.length > 3) {
            toast.error("You can only upload up to 3 images");
            return;
        }

        setFiles([...files, ...selectedFiles]);

        // Generate previews
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeFile = (index) => {
        const newFiles = [...files];
        const newPreviews = [...previews];

        URL.revokeObjectURL(newPreviews[index]); // Cleanup
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);

        setFiles(newFiles);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('subject', formData.subject);
            data.append('type', formData.type);
            data.append('message', formData.message);

            files.forEach(file => {
                data.append('attachments', file);
            });

            await createTicket(data);
            toast.success("Ticket created successfully!");
            navigate('..');
        } catch (error) {
            console.error("Create ticket error", error);
            toast.error("Failed to create ticket");
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="min-h-screen bg-[var(--bg-color)] md:p-8">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-[var(--secondary-color)] hover:text-[var(--text-color)] mb-6 transition-colors"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Support
                </button>

                <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                    <div className="p-5 md:p-6 border-b border-[var(--border-color)]">
                        <h1 className="text-xl font-bold text-[var(--text-color)] mb-1">Create Support Ticket</h1>
                        <p className="text-[var(--secondary-color)] text-sm">Describe your issue in detail and we'll get back to you</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-color)] mb-1.5">Category</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-color)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="feedback">Feedback</option>
                                    <option value="complaint">Complaint</option>
                                    <option value="bug">Bug Report</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-color)] mb-1.5">Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Brief summary of the issue"
                                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-color)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-color)] mb-1.5">Message</label>
                            <textarea
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Describe your issue..."
                                rows={4}
                                className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-color)] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-color)] mb-2">Attachments (Optional)</label>

                            <div className="flex flex-wrap gap-4 mb-2">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--border-color)] group">
                                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(idx)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                {files.length < 3 && (
                                    <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-color)] rounded-xl cursor-pointer hover:border-blue-500 hover:text-blue-500 text-[var(--secondary-color)] transition-all bg-[var(--bg-color)] hover:bg-blue-500/5">
                                        <ImageIcon size={20} className="mb-1" />
                                        <span className="text-[10px]">Add Image</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-[var(--secondary-color)]">Max 3 images. Supported formats: JPG, PNG.</p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit Ticket
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTicket;
