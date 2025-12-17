import React, { useEffect, useState } from "react";
import { API } from "../../../api/authservices/authservice";
import useDebounce from "../../../hooks/useDebounce";
import { FaDownload, FaTimes } from "react-icons/fa";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500); // Debounce search
  const [selectedPatient, setSelectedPatient] = useState(null);

  // View Report State
  const [selectedReport, setSelectedReport] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState(null); // Added state for text content

  useEffect(() => {
    fetchPatients();
  }, [patients, selectedPatient]);

  const fetchPatients = async () => {
    try {
      // Use new dedicated endpoint that returns MRN
      const res = await API.get("/doctors/my-patients");
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patientId) => {
    try {
      const res = await API.get(`/doctors/patient/${patientId}`);
      setSelectedPatient(res.data);
    } catch (err) {
      console.error("Error fetching patient details:", err);
      alert("Failed to load patient details");
    }
  };

  const filtered = patients.filter(p =>
    (p.name && p.name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
    (p.mobile && p.mobile.includes(debouncedSearch)) ||
    (p.mrn && p.mrn.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  // --- Report Viewing Logic ---

  const isPDF = (type) => type === "application/pdf";
  // Updated isDoc to exclude text/plain
  const isDoc = (type) => (type.includes("word") || type.includes("document")) && !type.includes("text/plain");

  const openReport = async (report) => {
    console.log("📂 Opening Report:", report);
    setSelectedReport(report);
    setPdfBlobUrl(null);
    setTextContent(null); // Reset text content

    // If it's a text file, fetch content directly
    if (report.type === 'text/plain') {
      console.log("📄 Fetching Text Content...");
      try {
        const response = await fetch(report.url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const text = await response.text();
        setTextContent(text);
      } catch (err) {
        console.error("❌ Text fetch failed:", err);
        setTextContent("Error loading text content.");
      }
      return;
    }

    // If it's a PDF, fetch as blob to display inline
    if (isPDF(report.type)) {
      try {
        console.log("🔐 Fetching PDF content...");
        const response = await fetch(report.url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

        const blob = await response.blob();
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);

        setPdfBlobUrl(blobUrl);
        console.log("✅ PDF fetched successfully");
      } catch (error) {
        console.error("❌ Failed to fetch PDF, falling back to URL:", error);
        setPdfBlobUrl(report.url);
      }
    }
  };

  const closeReport = () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setSelectedReport(null);
    setTextContent(null);
  };

  // Helper handling download forcefully if needed inside modal
  const downloadReport = (report) => {
    const link = document.createElement("a");
    link.href = report.url;
    link.download = report.name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full md:p-8" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="p-5 rounded-xl shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>My Patients</h2>
        <div className="w-full md:w-auto">
          <input
            type="text"
            placeholder="Search name, mobile or MRN..."
            className="w-full md:w-80 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* PATIENT DETAILS VIEW (INLINE) */}
      {selectedPatient ? (
        <div className="mt-6 rounded-xl shadow overflow-hidden animate-fade-in" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          {/* Header */}
          <div className="flex justify-between items-center p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>Patient Details</h2>
            <button
              onClick={() => setSelectedPatient(null)}
              className="px-4 py-2  rounded-lg transition-colors flex items-center gap-2"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <span>← Back to List</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">

            {/* Personal Info */}
            <section>
              <h3 className="text-lg font-semibold text-blue-400 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Full Name</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>{selectedPatient.personal.name}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Mobile</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>{selectedPatient.personal.mobile || "—"}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Email</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>{selectedPatient.personal.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Age / Gender</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>
                    {selectedPatient.personal.age ? `${selectedPatient.personal.age} yrs` : "—"} / {selectedPatient.personal.gender || "—"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Address</p>
                  <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>{selectedPatient.personal.address || "—"}</p>
                </div>
              </div>
            </section>

            {/* Health Snapshot */}
            <section>
              <h3 className="text-lg font-semibold text-blue-400 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>Health Snapshot</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className=" p-5 rounded-xl border border-red-900/50">
                  <p className=" font-semibold mb-2 text-lg">Conditions</p>
                  <p className="text-gray-400">{selectedPatient.health.medicalHistory || selectedPatient.health.conditions || "None"}</p>
                </div>
                <div className=" p-5 rounded-xl border border-yellow-900/50">
                  <p className=" font-semibold mb-2 text-lg">Allergies</p>
                  <p className="text-gray-400">{selectedPatient.health.allergies || "None"}</p>
                </div>
                <div className=" p-5 rounded-xl border border-green-900/50">
                  <p className=" font-semibold mb-2 text-lg">Current Medications</p>
                  <p className="text-gray-400">{selectedPatient.health.medications || "None"}</p>
                </div>
              </div>
            </section>

            {/* Recent History */}
            <section>
              <h3 className="text-lg font-semibold text-blue-400 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>Recent History</h3>
              {selectedPatient.history.length === 0 ? (
                <p className="italic" style={{ color: 'var(--secondary-color)' }}>No history found.</p>
              ) : (
                <div className="space-y-4">
                  {selectedPatient.history.map((item) => (
                    <div key={item._id} className="p-2 rounded-xl hover:border-blue-500/50 transition-colors" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>{new Date(item.date).toLocaleDateString()}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'Completed' ? 'bg-green-900 text-green-300' :
                          item.status === 'Cancelled' ? 'bg-red-900 text-red-300' :
                            'bg-blue-900 text-blue-300'
                          }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <p style={{ color: 'var(--text-color)' }}><span className="text-sm block" style={{ color: 'var(--secondary-color)' }}>Reason</span> {item.reason}</p>
                        <p style={{ color: 'var(--text-color)' }}><span className="text-sm block" style={{ color: 'var(--secondary-color)' }}>Doctor</span> {item.doctorName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Medical Reports */}
            <section>
              <h3 className="text-lg font-semibold text-blue-400 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>Medical Reports</h3>
              {(!selectedPatient.reports || selectedPatient.reports.length === 0) ? (
                <p className="italic" style={{ color: 'var(--secondary-color)' }}>No reports uploaded.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedPatient.reports.map((report) => (
                    <div key={report._id} className="p-4 rounded-xl flex items-center justify-between group hover:border-blue-500 transition-colors" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="text-3xl p-2 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                          {report.type.startsWith("image/") ? "🖼️" :
                            report.type === "application/pdf" ? "📕" :
                              report.type.startsWith("video/") ? "🎥" :
                                report.type.startsWith("audio/") ? "🎵" : "📄"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate group-hover:text-blue-400 transition-colors" style={{ color: 'var(--text-color)' }}>{report.name}</p>
                          <p className="text-xs" style={{ color: 'var(--secondary-color)' }}>{report.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openReport(report)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      ) : (
        <div className="mt-6 p-5 rounded-xl shadow overflow-x-auto" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          {loading ? (
            <p className="text-center py-4" style={{ color: 'var(--secondary-color)' }}>Loading patients...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-4" style={{ color: 'var(--secondary-color)' }}>No patients found</p>
          ) : (
            <table className="w-full border-collapse min-w-[600px]" style={{ color: 'var(--text-color)' }}>
              <thead>
                <tr className="text-left" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="py-2">MRN</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Mobile</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Last Reason</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2 font-mono text-sm text-blue-500">{p.mrn || "N/A"}</td>
                    <td className="py-2 font-medium" style={{ color: 'var(--text-color)' }}>{p.name}</td>
                    <td className="py-2">{p.mobile}</td>
                    <td className="py-2">{p.email}</td>
                    <td className="py-2" style={{ color: 'var(--secondary-color)' }}>{p.reason}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleViewPatient(p._id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Report Viewer Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-lg max-w-6xl max-h-[90vh] w-full overflow-hidden border border-[var(--border-color)] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)] bg-[var(--bg-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-color)]">
                {selectedReport.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={closeReport}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-[var(--bg-color)] flex items-center justify-center">
              {/* Added dedicated block for text/plain */}
              {selectedReport.type === 'text/plain' ? (
                <div className="w-full h-[70vh] border rounded-lg bg-gray-50 p-4 overflow-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-[var(--text-color)]">
                    {textContent || "Loading text content..."}
                  </pre>
                </div>
              ) : selectedReport.type.startsWith("image/") ? (
                <img
                  src={selectedReport.url}
                  alt={selectedReport.name}
                  className="max-w-full max-h-[70vh] rounded-lg"
                />
              ) : isPDF(selectedReport.type) ? (
                <div className="w-full h-[70vh] flex flex-col">
                  {!pdfBlobUrl ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-[var(--secondary-color)]">Loading PDF...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <object
                        data={pdfBlobUrl}
                        type="application/pdf"
                        className="w-full flex-1 border-0 rounded-lg"
                      >
                        <div className="flex flex-col items-center justify-center h-full text-[var(--secondary-color)]">
                          <p className="mb-4">Unable to display PDF directly.</p>
                          <button
                            onClick={() => downloadReport(selectedReport)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
                          >
                            Download PDF to View
                          </button>
                        </div>
                      </object>
                      {/* <div className="mt-4 text-center">
                        <button
                          onClick={() => downloadReport(selectedReport)}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2 mx-auto shadow-lg hover:shadow-green-500/50"
                        >
                          <FaDownload className="text-sm" />
                          Download PDF
                        </button>
                      </div> */}
                    </>
                  )}
                </div>
              ) : isDoc(selectedReport.type) ? (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    selectedReport.url
                  )}&embedded=true`}
                  title={selectedReport.name}
                  className="w-full h-[70vh] border-0 rounded-lg"
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-[var(--secondary-color)] mb-2 text-lg">
                    {selectedReport.name}
                  </p>
                  <p className="text-[var(--secondary-color)] text-sm mb-4">
                    This file type cannot be previewed directly.
                  </p>
                  <button
                    onClick={() => downloadReport(selectedReport)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white flex items-center gap-2 mx-auto"
                  >
                    <FaDownload />
                    Download File
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border-color)] text-sm text-[var(--secondary-color)] grid grid-cols-1 md:grid-cols-3 gap-2 bg-[var(--card-bg)]">
              <p><span className="text-[var(--secondary-color)]">Date:</span> {selectedReport.date}</p>
              <p><span className="text-[var(--secondary-color)]">Type:</span> {selectedReport.type}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
