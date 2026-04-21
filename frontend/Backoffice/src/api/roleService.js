// src/services/roleService.js
import axios from "axios";

const API_URL = "http://localhost:8080/api/roles";

// Récupérer le token *à chaque requête* pour éviter un token obsolète
const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  withCredentials: true,
});

export const roleService = {
  // --- ROLES ---
  getAllRoles() {
    return axios.get(`${API_URL}/all_roles`, authHeaders());
  },

  createRole(roleData) {
    return axios.post(`${API_URL}/roles`, roleData, authHeaders());
  },

  updateRole(roleId, roleData) {
    return axios.put(`${API_URL}/roles/${roleId}`, roleData, authHeaders());
  },

  updateRolePermissions(roleId, permissionIds) {
    return axios.put(
      `${API_URL}/roles/${roleId}/permissions`,
      permissionIds,
      authHeaders()
    );
  },

  // --- PERMISSIONS ---
  getAllPermissions() {
    return axios.get(`${API_URL}/permissions`, authHeaders());
  },

  getPermissionById(permissionId) {
    return axios.get(`${API_URL}/permissions/${permissionId}`, authHeaders());
  },

  createPermission(permissionData) {
    return axios.post(
      `${API_URL}/permissions`,
      permissionData,
      authHeaders()
    );
  },

  updatePermission(permissionId, permissionData) {
    return axios.put(
      `${API_URL}/permissions/${permissionId}`,
      permissionData,
      authHeaders()
    );
  },

  deletePermission(permissionId) {
    return axios.delete(
      `${API_URL}/permissions/${permissionId}`,
      authHeaders()
    );
  },

  // Si tu as réellement besoin de fetchPermissions
  fetchPermissions(roleId) {
    return axios.get(`${API_URL}/roles/${roleId}/permissions`, authHeaders());
  },
};
