import axios from "axios";

const isDev = import.meta.env.MODE === "development";

export const BASE_URL = isDev
  ? "http://localhost:3000"
  : "https://hms-backend-1qt4.onrender.com";

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
});

export const setAuthTokens = (userId, tokens) => {
  if (!tokens) {
    sessionStorage.removeItem(`hms_auth_tokens_${userId}`);
    if (isDev) {
      localStorage.removeItem(`hms_auth_tokens_${userId}`);
    }
    return;
  }

  const tokenStr = JSON.stringify(tokens);
  sessionStorage.setItem(`hms_auth_tokens_${userId}`, tokenStr);
  if (isDev) {
    localStorage.setItem(`hms_auth_tokens_${userId}`, tokenStr);
  }
  sessionStorage.setItem("hms_current_user", userId);
};

// Get tokens of currently active user
export const getAuthTokens = () => {
  const activeUserId = sessionStorage.getItem("hms_current_user");
  if (!activeUserId) return null;

  // Try SessionStorage first
  const sessionTokens = sessionStorage.getItem(`hms_auth_tokens_${activeUserId}`);
  if (sessionTokens) return JSON.parse(sessionTokens);

  // Fallback to LocalStorage if in Dev (and session missing - e.g. after refresh if session cleared?) 
  // actually session survives refresh. But let's leave straightforward logic.
  if (isDev) {
    const localTokens = localStorage.getItem(`hms_auth_tokens_${activeUserId}`);
    if (localTokens) return JSON.parse(localTokens);
  }

  return null;
};

export const clearAuthTokens = (userId) => {
  sessionStorage.removeItem(`hms_auth_tokens_${userId}`);
  if (isDev) {
    localStorage.removeItem(`hms_auth_tokens_${userId}`);
  }
};

export const getActiveUser = () => {
  const userId = sessionStorage.getItem("hms_current_user");
  if (!userId) return null;
  return JSON.parse(sessionStorage.getItem(`hms_user_${userId}`));
};

API.interceptors.request.use((config) => {
  const tokens = getAuthTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, newToken = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(newToken);
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalReq = err.config;
    if (err.response?.status === 401 && !originalReq._retry) {
      const tokens = getAuthTokens();
      if (!tokens?.refreshToken) return Promise.reject(err);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalReq.headers.Authorization = `Bearer ${newToken}`;
            return API(originalReq);
          })
          .catch((e) => Promise.reject(e));
      }

      originalReq._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await API.post("/auth/refresh", {
          refreshToken: tokens.refreshToken,
        });

        const newTokens = refreshRes.data.tokens;
        const activeUserId = sessionStorage.getItem("hms_current_user");

        setAuthTokens(activeUserId, newTokens);

        processQueue(null, newTokens.accessToken);
        isRefreshing = false;

        originalReq.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return API(originalReq);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);

  if (res?.data?.user && res?.data?.tokens) {
    const user = res.data.user;
    const userId = user.id;

    // Save user profile
    sessionStorage.setItem(`hms_user_${userId}`, JSON.stringify(user));
    if (isDev) {
      localStorage.setItem(`hms_user_${userId}`, JSON.stringify(user));
    }

    // Save tokens for that user
    setAuthTokens(userId, res.data.tokens);
  }

  return res.data;
};


export const sendOtp = async (data) => {
  const res = await API.post("/auth/send-otp", data);
  return res.data;
};

export const forgotpasssword = async (data) => {
  const res = await API.post("/auth/forgot-password", data);
  return res.data;
};

export const resetPassword = async (data) => {
  const res = await API.patch("/auth/reset-password", data);
  return res.data;
};

// MULTI-USER LOGIN
export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);

  if (res?.data?.user && res?.data?.tokens) {
    const user = res.data.user;
    const userId = user.id;

    // Save user profile
    sessionStorage.setItem(`hms_user_${userId}`, JSON.stringify(user));
    if (isDev) {
      localStorage.setItem(`hms_user_${userId}`, JSON.stringify(user));
    }

    // Save tokens for that user
    setAuthTokens(userId, res.data.tokens);
  }

  return res.data;
};

export const refreshToken = async (refreshToken) => {
  const res = await API.post("/auth/refresh", { refreshToken });
  return res.data;
};

export const logoutUser = async (userId) => {

  if (!userId) {
    const active = getActiveUser();
    if (active) userId = active.id;
  }

  if (!userId) {
    userId = sessionStorage.getItem("hms_current_user");
  }
  try {
    let tokens = null;
    if (userId) {
      tokens = JSON.parse(sessionStorage.getItem(`hms_auth_tokens_${userId}`));
    }

    if (!tokens) {
    } else if (tokens.refreshToken) {
      await API.post("/auth/logout", { refreshToken: tokens.refreshToken });
    }
  } catch (err) {
    console.error("Logout API call failed or no tokens found:", err);
  }

  if (userId) {
    sessionStorage.removeItem(`hms_auth_tokens_${userId}`);
    sessionStorage.removeItem(`hms_user_${userId}`);

    localStorage.removeItem(`hms_auth_tokens_${userId}`);
    localStorage.removeItem(`hms_user_${userId}`);
  }
  const globalKeys = [
    "authtoken",
    "deliveryAddress",
    "hms_current_user",
  ];

  globalKeys.forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem("hms_current_user");

    if (key === 'authtoken' || key === 'deliveryAddress') {
      localStorage.removeItem(key);
    }
  });
};

export const getCurrentUser = async () => {
  const res = await API.get("/auth/me");
  return res.data;
};

export const deleteAccount = async (userId) => {
  const res = await API.delete(`/admin/users/${userId}`);
  return res.data;
};

export const createHospital = async (data) => {
  const res = await API.post("/hospitals", data);
  return res.data;
};

export const submitSupportRequest = async (data) => {
  const res = await API.post("/support", data);
  return res.data;
};

export const loginHelpDesk = async (data) => {
  const res = await API.post("/helpdesk/login", data);

  if (res?.data?.user && res?.data?.tokens) {
    const user = res.data.user;
    const userId = user.id;

    sessionStorage.setItem(`hms_user_${userId}`, JSON.stringify(user));
    if (isDev) {
      localStorage.setItem(`hms_user_${userId}`, JSON.stringify(user));
    }
    setAuthTokens(userId, res.data.tokens);
  }

  return res.data;
};

export { API };