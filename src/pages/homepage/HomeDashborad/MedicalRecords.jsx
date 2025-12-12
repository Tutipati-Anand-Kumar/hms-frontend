import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaCalendarAlt,
  FaUpload,
  FaDownload,
  FaTimes,
} from "react-icons/fa";
import { API, getActiveUser } from "../../../api/authservices/authservice";

const MedicalRecords = () => {
  const [reports, setReports] = useState({});
  // FIX: Default to today's date so uploads have a destination
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null); // Store PDF blob URL

  // Get current patient ID
  useEffect(() => {
    const user = getActiveUser() || {};
    const id = user.id || user.patientId || "default-patient";
    setPatientId(id);

    if (id && id !== "default-patient") {
      fetchReports(id);
    }
  }, []);

  const fetchReports = async (id) => {
    try {
      const res = await API.get(`/reports/patient/${id}`);
      // Group reports by date
      const grouped = res.data.reduce((acc, report) => {
        const date = report.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push({
          id: report._id,
          name: report.name,
          type: report.type,
          data: report.url,
          public_id: report.public_id,
          date: report.date,
          patientId: report.patient,
          size: report.size,
          uploadDate: report.createdAt
        });
        return acc;
      }, {});
      setReports(grouped);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  // Handle File Upload
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!selectedDate) {
      alert("Please select a report date before uploading.");
      return;
    }

    if (!patientId) {
      alert("Patient ID not found. Please refresh the page.");
      return;
    }

    setIsUploading(true);

    try {
      await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("report", file);

          // 1. Upload to Cloudinary
          const res = await API.post("/reports/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          // 2. Save metadata to DB
          await API.post("/reports/save", {
            patientId,
            name: file.name,
            url: res.data.url,
            type: file.type,
            public_id: res.data.public_id,
            date: selectedDate,
            size: file.size
          });
        })
      );

      // Refresh reports
      fetchReports(patientId);

      // Clear file input
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      alert("Please select a report date before uploading.");
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    const event = { target: { files } };
    await handleUpload(event);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // View report in modal
  const openReport = async (report) => {
    console.log("📂 Opening Report:", report);
    setSelectedReport(report);

    // If it's a PDF, fetch it with auth headers
    if (isPDF(report.type)) {
      try {
        console.log("🔐 Fetching PDF with authentication...");

        // Fetch PDF through API (includes Authorization header)
        const response = await API.get(`/reports/proxy/${report.id}`, {
          responseType: 'blob' // Important: get as blob
        });

        // Create blob URL from response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        setPdfBlobUrl(blobUrl);
        console.log("✅ PDF fetched successfully with auth");

      } catch (error) {
        console.error("❌ Failed to fetch PDF proxy, falling back to direct URL:", error);
        // Fallback: Try to load the original URL directly (ignores backend 401/500)
        setPdfBlobUrl(report.data); 
      }
    }
  };

  const closeReport = () => {
    // Clean up blob URL to prevent memory leaks
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setSelectedReport(null);
  };

  // Delete report
  const deleteReport = async (date, reportId) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await API.delete(`/reports/${reportId}`);

        setReports((prev) => {
          const updatedDateReports = prev[date].filter(
            (report) => report.id !== reportId
          );

          if (updatedDateReports.length === 0) {
            const { [date]: removed, ...rest } = prev;
            return rest;
          }

          return {
            ...prev,
            [date]: updatedDateReports,
          };
        });
      } catch (err) {
        console.error("Error deleting report:", err);
        alert("Failed to delete report");
      }
    }
  };

  // Download report
  const downloadReport = (report) => {
    console.log("📥 Downloading:", report.name);
    const link = document.createElement("a");
    link.href = report.data;
    link.download = report.name;
    link.target = "_blank"; // Open in new tab for download if needed
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check file types
  const isPDF = (type) => type === "application/pdf";
  const isDoc = (type) => type.includes("word") || type.includes("document") || type.includes("text");

  // Trigger file input when clicking anywhere in upload box
  const triggerFileInput = () => {
    document.getElementById("file-upload").click();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] max-w-7xl mx-auto">
      <h1 className="text-2xl max-sm:text-[18px] font-bold mb-2">Medical Records</h1>
      <p className="text-[var(--secondary-color)] mb-6">Patient ID: {patientId}</p>

      {/* Combined Date Selector and Upload Box */}
      <div className="bg-[var(--card-bg)] p-6 rounded-lg mb-8 border border-[var(--border-color)]">
        <div className="flex flex-row  max-lg:flex-col items-center justify-between gap-6">
          {/* Date Selector */}
          <div
            className="flex-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-4 cursor-pointer hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 group"
            onClick={() => document.getElementById("date-input").showPicker()}
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <FaCalendarAlt className="text-blue-400 text-lg" />
              </div>

              <div className="flex-1 max-sm:w-50 max-lg:w-50">
                <label
                  htmlFor="date-input"
                  className="text-[var(--secondary-color)] block text-xs font-medium mb-1"
                >
                  Select Report Date
                </label>

                <input
                  id="date-input"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-transparent border-none text-[var(--text-color)] text-sm font-medium focus:outline-none focus:ring-0 cursor-pointer"
                />

                {selectedDate && (
                  <p className="text-green-400 text-xs mt-1">
                    Selected: {new Date(selectedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Upload Box */}
          <div
            className="flex-1 bg-[var(--bg-color)] border-2 border-dashed border-[var(--border-color)] rounded-xl p-4 cursor-pointer hover:border-green-500 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 group"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={triggerFileInput}
          >
            <input
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
              id="file-upload"
              accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.txt"
              disabled={isUploading}
            />

            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-colors ${isUploading
                  ? "bg-yellow-500/20"
                  : "bg-green-500/20 group-hover:bg-green-500/30"
                  }`}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
                ) : (
                  <FaUpload
                    className={`text-lg ${isUploading ? "text-yellow-400" : "text-green-400"
                      }`}
                  />
                )}
              </div>

              <div className="flex-1">
                <p
                  className={`font-semibold text-sm ${isUploading
                    ? "text-yellow-400"
                    : "text-[var(--secondary-color)] group-hover:text-[var(--text-color)]"
                    }`}
                >
                  {isUploading ? "Uploading..." : "Add Medical Reports"}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {isUploading ? "Processing files..." : "Click or drag & drop"}
                </p>
              </div>

              {!isUploading && (
                <div className="bg-blue-500/20 p-2 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <FaPlus className="text-blue-400 text-base" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Display Reports */}
      <div className="mt-8">
        {Object.keys(reports).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-600">📁</div>
            <p className="text-gray-400 text-xl">
              No medical reports uploaded yet.
            </p>
            <p className="text-gray-500 mt-2">
              Select a date and upload your first report above.
            </p>
          </div>
        ) : (
          Object.keys(reports)
            .sort()
            .reverse()
            .map((date) => (
              <div key={date} className="mb-8">
                <h3 className="text-xl font-bold mb-3 text-blue-400 border-b border-[var(--border-color)] pb-2">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {reports[date].map((report) => (
                    <div
                      key={report.id}
                      className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] hover:border-blue-500 transition-colors group hover:shadow-lg hover:shadow-blue-500/5"
                    >
                      {report.type.startsWith("image/") ? (
                        <div
                          className="w-full h-48 bg-black/20 rounded-md overflow-hidden cursor-pointer"
                          onClick={() => openReport(report)}
                        >
                          <img
                            src={report.data}
                            alt={report.name}
                            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : isPDF(report.type) ? (
                        <div
                          className="text-center text-[var(--secondary-color)] py-8 cursor-pointer hover:bg-black/20 rounded-md h-48 flex flex-col items-center justify-center group-hover:bg-black/30 transition-colors"
                          onClick={() => openReport(report)}
                        >
                          <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                            📕
                          </div>
                          <p className="text-sm truncate px-2">{report.name}</p>
                          <p className="text-xs text-blue-400 mt-2">
                            Click to view PDF
                          </p>
                        </div>
                      ) : (
                        <div
                          className="text-center text-[var(--secondary-color)] py-8 cursor-pointer hover:bg-black/20 rounded-md h-48 flex flex-col items-center justify-center group-hover:bg-black/30 transition-colors"
                          onClick={() => openReport(report)}
                        >
                          <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                            📄
                          </div>
                          <p className="text-sm truncate px-2">{report.name}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Click to preview
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex justify-between items-center">
                        <p className="text-xs text-[var(--secondary-color)] truncate flex-1 mr-2">
                          {report.name}
                        </p>
                        <div className="flex space-x-2">

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteReport(date, report.id);
                            }}
                            className="text-red-400 hover:text-red-300 text-xs p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                            title="Delete report"
                          >
                            <FaTimes className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

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
              {selectedReport.type.startsWith("image/") ? (
                <img
                  src={selectedReport.data}
                  alt={selectedReport.name}
                  className="max-w-full max-h-[70vh] rounded-lg"
                />
              ) : isPDF(selectedReport.type) ? (
                <div className="w-full h-[70vh] flex flex-col">
                  {/* DEBUG LOGGING */}
                  {console.log("🔍 PDF Report ID:", selectedReport.id)}
                  {console.log("🔍 PDF Name:", selectedReport.name)}
                  {console.log("🔍 PDF Blob URL:", pdfBlobUrl)}

                  {!pdfBlobUrl ? (
                    // Loading state while fetching PDF
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-[var(--secondary-color)]">Loading PDF...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* PDF Preview via Blob URL (includes auth) */}
                      <object
                        data={pdfBlobUrl}
                        type="application/pdf"
                        className="w-full flex-1 border-0 rounded-lg"
                      >
                        {/* Fallback for browsers that don't support object/pdf */}
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

                      {/* Download Button Below Preview */}
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => {
                            console.log("📥 Downloading PDF:", selectedReport.name);
                            downloadReport(selectedReport);
                          }}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2 mx-auto shadow-lg hover:shadow-green-500/50"
                        >
                          <FaDownload className="text-sm" />
                          Download PDF
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : isDoc(selectedReport.type) ? (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedReport.data)}&embedded=true`}
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
              <p>
                <span className="text-[var(--secondary-color)]">Uploaded:</span>{" "}
                {new Date(selectedReport.uploadDate).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-500">Report Date:</span>{" "}
                {selectedReport.date}
              </p>
              <p>
                <span className="text-gray-500">File Size:</span>{" "}
                {(selectedReport.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        </div >
      )}
    </div >
  );
};

export default MedicalRecords;
