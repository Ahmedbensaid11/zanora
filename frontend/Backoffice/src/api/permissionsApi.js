import axios from "axios";

const API_URL = "http://localhost:8080/api/permissions";

const token = localStorage.getItem("authToken");

const axiosConfig = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
  withCredentials: true,
};

export default {
  checkPermission(resource, action) {
    return axios.get(`${API_URL}/check`, {
      ...axiosConfig,
      params: {
        resource: resource,
        action: action,
      },
    });
  }
};
