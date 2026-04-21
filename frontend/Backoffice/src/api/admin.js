import axios from 'axios';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    withCredentials: true,
  };
};

export const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log("Making request with token:", token ? "Token exists" : "No token");
    
    const response = await axios.get('http://localhost:8080/api/users/getallusers', {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      withCredentials: true,
    });
    
    console.log("Response received:", response.status);
    return response.data;
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

export const activateUserApi = async (id, userData) => {
  return await axios.put(
    `http://localhost:8080/api/users/${id}/activate`,
    userData,
    getAuthConfig()
  );
};

export const deactivateUserApi = async (id, userData) => {
  return await axios.put(
    `http://localhost:8080/api/users/${id}/deactivate`,
    userData,
    getAuthConfig()
  );
};

export const createUsers = async (userData) => {
  return axios.post(
    'http://localhost:8080/api/users/create_user',
    userData,
    getAuthConfig()
  );
};

export const deleteUsers = async (userToDelete) => {
  return axios.delete(
    `http://localhost:8080/api/users/${userToDelete}`,
    getAuthConfig()
  );
};

export const updateUser = async (id, userData) => {
  const response = await axios.put(
    `http://localhost:8080/api/users/${id}`,
    userData,
    getAuthConfig()
  );
  return response;
};