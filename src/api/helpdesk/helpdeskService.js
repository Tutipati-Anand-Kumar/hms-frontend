import { API } from "../authservices/authservice";

export const login = async (data) => {
  try {
    const res = await API.post("/helpdesk/login", data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const refresh = async (refreshToken) => {
  try {
    const res = await API.post("/helpdesk/refresh", { refreshToken });
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const logout = async (refreshToken) => {
  try {
    await API.post("/helpdesk/logout", { refreshToken });
  } catch (err) {
    // ignore
  }
};

export const me = async () => {
  try {
    const res = await API.get("/helpdesk/me");
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const updateMe = async (data) => {
  try {
    const res = await API.put("/helpdesk/me", data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const getDashboard = async () => {
  try {
    const res = await API.get("/helpdesk/dashboard");
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const createDoctorByHelpdesk = async (data) => {
  try {
    const res = await API.post("/helpdesk/doctor", data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const getHelpDeskMe = me;

export const getHelpDeskDoctors = async () => {
  try {
    const res = await API.get("/helpdesk/doctors");
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export default { login, refresh, logout, me, updateMe, getDashboard, createDoctorByHelpdesk, getHelpDeskMe, getHelpDeskDoctors };
