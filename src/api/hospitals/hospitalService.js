import { API } from "../authservices/authservice";

export const createHospital = async (data) => {
  try {
    const res = await API.post("/hospitals", data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const listHospitals = async () => {
  try {
    const res = await API.get("/hospitals");
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const getHospital = async (id) => {
  try {
    const res = await API.get(`/hospitals/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const patchHospital = async (id, data) => {
  try {
    const res = await API.patch(`/hospitals/${id}`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const addBranch = async (id, data) => {
  try {
    const res = await API.post(`/hospitals/${id}/branches`, data);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export const listBranches = async (id) => {
  try {
    const res = await API.get(`/hospitals/${id}/branches`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Server Error" };
  }
};

export default {
  createHospital,
  listHospitals,
  getHospital,
  patchHospital,
  addBranch,
  listBranches,
};
