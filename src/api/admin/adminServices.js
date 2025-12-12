import { API } from "../authservices/authservice";

// --- Analytics & Dashboard ---
export const getAdminDashboard = async () => {
  try {
    const res = await API.get("/admin/analytics/dashboard");
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const getAuditLogs = async () => {
  try {
    const res = await API.get("/admin/audits");
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

// --- Profile Management ---
export const getMyProfile = async () => {
  try {
    const res = await API.get("/admin/me");
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const updateMyProfile = async (data) => {
  try {
    const res = await API.put("/admin/me", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

// --- User Management ---
export const getAllUsers = async (role) => {
  try {
    const res = await API.get(`/admin/users${role ? `?role=${role}` : ""}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const deleteUser = async (id) => {
  try {
    const res = await API.delete(`/admin/users/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const updateUser = async (id, data) => {
  try {
    const res = await API.put(`/admin/users/${id}`, data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

// --- Creation Services ---
export const createAdmin = async (data) => {
  try {
    const res = await API.post("/admin/create-admin", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const createDoctor = async (data) => {
  try {
    const res = await API.post("/admin/create-doctor", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const createHelpDesk = async (data) => {
  try {
    const res = await API.post("/admin/create-helpdesk", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const createHospital = async (data) => {
  try {
    const res = await API.post("/admin/create-hospital", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const bulkCreateHospitals = async (data) => {
  try {
    const res = await API.post("/admin/hospitals/bulk", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

// --- Hospital Management ---
export const listHospitals = async () => {
  try {
    const res = await API.get("/admin/hospitals");
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const updateHospitalStatus = async (id, status) => {
  try {
    const res = await API.patch(`/admin/hospitals/${id}/status`, { status });
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const getHospitalWithDoctors = async (id) => {
  try {
    const res = await API.get(`/admin/hospitals/${id}/details`);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const listDoctorsByHospital = async (id) => {
  try {
    const res = await API.get(`/admin/hospitals/${id}/doctors`);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

// --- Assignments ---
export const assignDoctorToHospital = async (data) => {
  try {
    const res = await API.post("/admin/hospitals/assign-doctor", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const removeDoctorFromHospital = async (hospitalId, doctorProfileId) => {
  try {
    const res = await API.post(`/admin/hospitals/${hospitalId}/remove-doctor`, { doctorProfileId });
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const assignHelpDeskToHospital = async (data) => {
  try {
    const res = await API.post("/admin/assign-helpdesk", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

// --- Communication ---
export const adminBroadcast = async (data) => {
  try {
    const res = await API.post("/admin/broadcast", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};

export const getSupportRequests = async () => {
  try {
    const res = await API.get("/support");
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Server Error" };
  }
};