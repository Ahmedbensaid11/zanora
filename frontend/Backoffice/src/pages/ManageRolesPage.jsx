import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { roleService } from "../api/roleService";
import CustomModal from '../components/CustomModal';
import SuccessAlert from '../components/SuccessAlert';
import ErrorAlert from '../components/ErrorAlert';
import '../styles/ManageRolesPage.css';
import { FaTrash, FaEdit } from 'react-icons/fa'; 

const ManageRolesPage = () => {
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState({
    name: '',
    description: '',
    color: '#000000',
    active: false,
    permissions: []
  });
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  
  const apiBaseUrl = 'http://localhost:8080/api/roles';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${apiBaseUrl}/all_roles`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setRoles(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      if (error.response?.status === 401) {
        navigate('/access-denied');
      }
      setError('Failed to load roles. Please try again.');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 200);
    }
  };

  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/permissions`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setAllPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      if (error.response?.status === 401) {
        navigate('/access-denied');
      }
    } finally {
      setLoadingPermissions(false);
    }
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setSelectedRole({
      name: '',
      description: '',
      color: '#6b7280',
      active: true,
      permissions: []
    });
    setShowModifyModal(true);
  };

  const openModifyModal = (role) => {
    setIsCreating(false);
    setSelectedRole({
      ...role,
      permissions: role.permissions || []
    });
    setShowModifyModal(true);
  };

  const closeModifyModal = () => {
    setShowModifyModal(false);
    setSelectedRole({
      name: '',
      description: '',
      color: '#000000',
      active: true,
      permissions: []
    });
    setIsCreating(false);
  };

  const openDeleteModal = (role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setRoleToDelete(null);
  };

  const saveRole = async () => {
    setShowError(false);
    if (!selectedRole.name.trim()) {
      alert('Role name is required');
      return;
    }

    setSaving(true);
    try {
      console.log(selectedRole.active);
      const roleData = {
        name: selectedRole.name,
        description: selectedRole.description,
        color: selectedRole.color,
        active: selectedRole.active,
        permissions: selectedRole.permissions.map(p => ({ id: p.id || p }))
      };
      console.log(roleData);
      
      let response;
      
      if (isCreating) {
        response = await axios.post(`${apiBaseUrl}/roles`, roleData, {
          headers: getAuthHeaders(),
          withCredentials: true
        });
      } else {
        const permissionIds = selectedRole.permissions.map(p => p.id || p);
        
        // Update permissions first
        await axios.put(
          `${apiBaseUrl}/roles/${selectedRole.id}/permissions`,
          permissionIds,
          {
            headers: getAuthHeaders(),
            withCredentials: true
          }
        );
        
        // Then update role
        response = await axios.put(
          `${apiBaseUrl}/roles/${selectedRole.id}`,
          roleData,
          {
            headers: getAuthHeaders(),
            withCredentials: true
          }
        );
      }

      const savedRole = response.data;
      console.log(savedRole);
      
      if (isCreating) {
        setRoles([...roles, savedRole]);
      } else {
        setRoles(roles.map(r => r.id === selectedRole.id ? savedRole : r));
      }

      closeModifyModal();
      setSuccessMessage(isCreating ? 'Role created successfully!' : 'Role updated successfully!');
      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving role:', error);
      setErrorMessage(error.response?.data || 'An error occurred while saving the role');
      setShowError(true);
      if (error.response?.status === 401) {
        navigate('/access-denied');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async () => {
    setDeleting(true);
    setShowError(false);
    try {
      await axios.delete(`${apiBaseUrl}/roles/${roleToDelete.id}`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });

      setRoles(roles.filter(r => r.id !== roleToDelete.id));
      closeDeleteModal();
      setSuccessMessage('Role deleted successfully!');
      setShowSuccess(true);
    } catch (error) {
      console.error('Error deleting role:', error.response?.status);
      setErrorMessage(error.response?.data || 'An error occurred while deleting the role');
      setShowError(true);
      if (error.response?.status === 401) {
        navigate('/access-denied');
      }
    } finally {
      setDeleting(false);
    }
  };

  const isPermissionSelected = (permissionId) => {
    return selectedRole?.permissions?.some(p => (p.id || p) === permissionId) || false;
  };

  const togglePermission = (permissionId) => {
    if (!selectedRole) return;
    
    const permissionIndex = selectedRole.permissions.findIndex(p => (p.id || p) === permissionId);
    if (permissionIndex !== -1) {
      const newPermissions = [...selectedRole.permissions];
      newPermissions.splice(permissionIndex, 1);
      setSelectedRole({ ...selectedRole, permissions: newPermissions });
    } else {
      const permission = allPermissions.find(p => p.id === permissionId);
      if (permission) {
        setSelectedRole({
          ...selectedRole,
          permissions: [...selectedRole.permissions, permission]
        });
      }
    }
  };

  return (
      
      
      
      <div className="container">
        <div className="alert-container">
        {showSuccess && (
          <SuccessAlert
            message={successMessage}
            autoClose={true}
            duration={2000}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
      
      <div className="alert-container">
        {showError && (
          <ErrorAlert
            message={errorMessage}
            autoClose={true}
            duration={2000}
            onClose={() => setShowError(false)}
          />
        )}
      </div>
        <div className="header">
          <h2>Roles Management</h2>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading roles...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button onClick={fetchRoles} className="btn btn-secondary">Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <div className="roles-table">
            <div className="table-header">
              <div className="col-role">Roles</div>
              <div className="col-description">Description</div>
              <div className="col-status">Status</div>
              <div className="col-permissions">Permissions</div>
              <div className="col-actions">Actions</div>
            </div>

            <div className="table-body">
              {roles.map(role => (
                <div key={role.id} className="table-row">
                  <div className="col-role">
                    <div className="role-info">
                      <div 
                        className="role-color" 
                        style={{ backgroundColor: role.color || '#6b7280' }}
                      ></div>
                      <span className="role-name">{role.name}</span>
                    </div>
                  </div>
                  
                  <div className="col-description">
                    <span className="description">{role.description || 'No description'}</span>
                  </div>

                  <div className="col-status">
                    <span className={`status-badge ${role.active ? 'active' : 'inactive'}`}>
                      {role.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="col-permissions">
                    <div className="permissions-info">
                      <span className="permission-count">
                        {role.permissions ? role.permissions.length : 0} permissions
                      </span>
                    </div>
                  </div>

                  <div className="col-actions">
                    <button 
                      onClick={() => openModifyModal(role)} 
                      className="action-btn modify" 
                      title="Edit Role"
                    >
                      <FaEdit/>

                    </button>
                    <button 
                      onClick={() => openDeleteModal(role)} 
                      className="action-btn delete" 
                      title="Delete Role"
                    >
                     
                      <FaTrash/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <CustomModal
          isVisible={showModifyModal}
          title={isCreating ? 'Create Role' : 'Modify Role'}
          primaryText={isCreating ? 'Create Role' : 'Save Changes'}
          cancelText="Cancel"
          loading={saving}
          loadingText={isCreating ? 'Creating...' : 'Saving...'}
          primaryDisabled={!selectedRole.name}
          size="large"
          onClose={closeModifyModal}
          onPrimaryAction={saveRole}
        >
          <div className="modal-form-grid">
            <div className="left-column">
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                  type="text"
                  className="form-input"
                  placeholder="Enter role name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                  className="form-input"
                  placeholder="Enter role description"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Role Color</label>
                <div className="color-input-container">
                  <input
                    value={selectedRole.color}
                    onChange={(e) => setSelectedRole({ ...selectedRole, color: e.target.value })}
                    type="color"
                    className="color-input"
                  />
                  <input
                    value={selectedRole.color}
                    onChange={(e) => setSelectedRole({ ...selectedRole, color: e.target.value })}
                    type="text"
                    className="form-input color-text"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    checked={selectedRole.active}
                    onChange={(e) => setSelectedRole({ ...selectedRole, active: e.target.checked })}
                    type="checkbox"
                  />
                  Active Role
                </label>
                <p>Current state: {String(selectedRole.active)}</p>
              </div>
            </div>
            
            <div className="right-column">
              <div className="form-group">
                <label>Permissions</label>
                {loadingPermissions ? (
                  <div className="loading-permissions">Loading permissions...</div>
                ) : (
                  <div className="permissions-list">
                    {allPermissions.map(permission => (
                      <div key={permission.id} className="permission-item">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={isPermissionSelected(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                          />
                          <div className="permission-info">
                            <strong>{permission.name}</strong>
                            {permission.description && <p>{permission.description}</p>}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CustomModal>
        
        {showDeleteModal && (
          <div className="modal-overlay" onClick={closeDeleteModal}>
            <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Delete Role</h3>
                <button onClick={closeDeleteModal} className="close-btn">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="delete-warning">
                  <i className="fas fa-exclamation-triangle warning-icon"></i>
                  <p>Are you sure you want to delete the role <strong>"{roleToDelete?.name}"</strong>?</p>
                  <p className="warning-text">This action cannot be undone. All users assigned to this role will lose their permissions.</p>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={closeDeleteModal} className="btn btn-secondary" disabled={deleting}>
                  Cancel
                </button>
                <button onClick={deleteRole} className="btn btn-danger" disabled={deleting}>
                  {deleting ? (
                    <span>
                      <i className="fas fa-spinner fa-spin"></i> Deleting...
                    </span>
                  ) : (
                    <span>Delete Role</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default ManageRolesPage;