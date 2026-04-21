import React, { useState, useEffect, useMemo } from 'react';
import { roleService } from "../api/roleService";
import CustomModal from '../components/CustomModal';
import SuccessAlert from '../components/SuccessAlert';
import ErrorAlert from '../components/ErrorAlert';
import '../styles/RolesPermissions.css';
import { FaTrash, FaEdit } from 'react-icons/fa'; 
import { FaSearch, FaExclamationCircle } from 'react-icons/fa'; 
import { MdDelete, MdEdit } from 'react-icons/md';

const RolesPermissions = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [showNewPermissionModal, setShowNewPermissionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    color: 'Blue',
    permissionIds: []
  });

  const [newPermission, setNewPermission] = useState({
    name: '',
    description: '',
    resource: '',
    customResource: '',
    action: '',
    isActive: true
  });

  const [editingPermission, setEditingPermission] = useState({
    id: null,
    name: '',
    assignedRoles: []
  });

  const roleColors = [
    { name: 'Blue', bg: '#e3f2fd', border: '#1976d2', text: '#1976d2' },
    { name: 'Green', bg: '#e8f5e8', border: '#2e7d32', text: '#2e7d32' },
    { name: 'Purple', bg: '#f3e5f5', border: '#7b1fa2', text: '#7b1fa2' },
    { name: 'Orange', bg: '#fff3e0', border: '#f57c00', text: '#f57c00' },
    { name: 'Red', bg: '#ffebee', border: '#c62828', text: '#c62828' },
    { name: 'red', bg: '#ffebee', border: '#c62828', text: '#c62828' },
    { name: 'Teal', bg: '#e0f2f1', border: '#00695c', text: '#00695c' }
  ];
    const rolesWithPermission = (permissionId) => {
    return roles.filter(role => 
      role.permissions?.some(p => p.id === permissionId)
    );
  };
  const groupedPermissions = useMemo(() => {
    const resources = {};
    
    permissions.forEach(permission => {
      const resource = permission.resource || 'Other';
      
      if (!resources[resource]) {
        resources[resource] = {
          name: resource,
          permissions: []
        };
      }
      
      resources[resource].permissions.push(permission);
    });
    
    return Object.values(resources);
  }, [permissions]);

  const filteredResources = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const roleFilter = filterBy;
    
    return groupedPermissions.map(resource => {
      const filteredPermissions = resource.permissions.filter(permission => {
        const matchesSearch = permission.name.toLowerCase().includes(query) || 
                             permission.description.toLowerCase().includes(query);
        
        const matchesRole = roleFilter === 'all' || 
          rolesWithPermission(permission.id).some(r => r.id == roleFilter);
          
        return matchesSearch && matchesRole;
      });
      
      return { ...resource, permissions: filteredPermissions };
    }).filter(resource => resource.permissions.length > 0);
  }, [groupedPermissions, searchQuery, filterBy]);

  const availableResources = useMemo(() => {
    const resources = [...new Set(permissions.map(p => p.resource).filter(Boolean))];
    return resources.sort();
  }, [permissions]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setError(null);
    setLoading(true);
    setIsLoading(true);

    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        roleService.getAllRoles(),
        roleService.getAllPermissions()
      ]);
      
      setRoles(rolesRes.data);
      setPermissions(permissionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 403) {
        window.location.href = '/access-denied';
      }
      setLoading(false);
      setError('Failed to load data. Please try again.');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 200);
      setIsLoading(false);
    }
  };

  const deletePer = async (permId) => {
    try {
      setShowError(false);
      setShowSuccess(false);
      setLoading(true);
      await roleService.deletePermission(permId);
      setSuccessMessage('Permission deleted successfully');
      setShowSuccess(true);
      await fetchData();
    } catch (error) {
      console.log('Failed to delete Permission:', error.response?.status);
      if (error.response?.status === 403) {
        window.location.href = '/access-denied';
      }
      if (error.response?.status === 409) {
        setErrorMessage('Cannot delete permission that is assigned to roles: Admin');
        setShowError(true);
      } else {
        setErrorMessage('Failed to delete Permission');
        setShowError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPermissionName = (name) => {
    return name
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };



  const roleBadgeStyle = (role) => {
    const color = roleColors.find(c => c.name.toLowerCase() === role.color.toLowerCase()) || 
                 roleColors[0];
    return {
      backgroundColor: color.bg,
      border: `1px solid ${color.border}`,
      color: color.text
    };
  };

  const isCategorySelected = (category) => {
    return category.permissions.every(p => 
      newRole.permissionIds.includes(p.id)
    );
  };

  const toggleCategory = (category, checked) => {
    const updatedPermissionIds = [...newRole.permissionIds];
    
    category.permissions.forEach(permission => {
      const index = updatedPermissionIds.indexOf(permission.id);
      
      if (checked && index === -1) {
        updatedPermissionIds.push(permission.id);
      } else if (!checked && index !== -1) {
        updatedPermissionIds.splice(index, 1);
      }
    });
    
    setNewRole({ ...newRole, permissionIds: updatedPermissionIds });
  };

  const openEditModal = (permission) => {
    setEditingPermission({
      id: permission.id,
      name: permission.name,
      assignedRoles: roles
        .filter(role => role.permissions?.some(p => p.id === permission.id))
        .map(role => role.id)
    });
    setShowEditModal(true);
  };

  const createPermission = async () => {
    setShowSuccess(false);
    setShowError(false);
    
    if (!newPermission.name.trim() || !newPermission.action.trim()) return;
    
    setIsLoading(true);
    try {
      const permissionData = {
        name: newPermission.name.toUpperCase(),
        description: newPermission.description,
        resource: newPermission.resource === 'custom' 
          ? newPermission.customResource.toUpperCase() 
          : newPermission.resource,
        action: newPermission.action,
        active: newPermission.isActive
      };

      await roleService.createPermission(permissionData);
      
      await fetchData();
      closePermissionModal();
      setSuccessMessage('Permission created successfully');
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating permission:', error);
      if (error.response?.status === 401) {
        window.location.href = '/access-denied';
      }
      setErrorMessage(error.response?.data?.message || 'Failed to create permission');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const createRole = async () => {
    setShowSuccess(false);
    setShowError(false);
    
    if (!newRole.name.trim()) return;
    
    setIsLoading(true);
    try {
      const roleData = {
        name: newRole.name,
        description: newRole.description,
        isActive: true,
        color: newRole.color,
        permissions: newRole.permissionIds.map(id => ({ id }))
      };
      
      await roleService.createRole(roleData);
      
      await fetchData();
      closeModal();
      setSuccessMessage('Role created successfully');
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating role:', error);
      if (error.response?.status === 403) {
        window.location.href = '/access-denied';
      }
      setErrorMessage(error.response?.data?.message || 'Failed to create role');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePermission = async () => {
    setShowSuccess(false);
    setShowError(false);
    setIsLoading(true);
    
    try {
      const permissionId = editingPermission.id;
      const roleIds = editingPermission.assignedRoles;
      
      await Promise.all(roles.map(async role => {
        const hasPermission = roleIds.includes(role.id);
        const shouldHavePermission = role.permissions?.some(p => p.id === permissionId);
        
        if (hasPermission !== shouldHavePermission) {
          const currentPermissions = role.permissions.map(p => p.id);
          
          if (hasPermission) {
            currentPermissions.push(permissionId);
          } else {
            const index = currentPermissions.indexOf(permissionId);
            if (index !== -1) currentPermissions.splice(index, 1);
          }
          
          await roleService.updateRolePermissions(role.id, currentPermissions);
        }
      }));
      
      await fetchData();
      closeEditModal();
      setSuccessMessage('Permission assignments updated successfully!');
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating permission:', error);
      if (error.response?.status === 403) {
        window.location.href = '/access-denied';
      }
      setErrorMessage('Failed to update permission. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowNewRoleModal(false);
    resetNewRole();
  };

  const closePermissionModal = () => {
    setShowNewPermissionModal(false);
    resetNewPermission();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPermission({
      id: null,
      name: '',
      assignedRoles: []
    });
  };

  const resetNewRole = () => {
    setNewRole({
      name: '',
      description: '',
      color: 'Blue',
      permissionIds: []
    });
  };

  const resetNewPermission = () => {
    setNewPermission({
      name: '',
      description: '',
      resource: '',
      customResource: '',
      action: '',
      isActive: true
    });
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
              onClose={() => setShowError(false)}
              autoClose={true}
              duration={2000}
            />
          )}
        </div>

        <div className="header">
          <h2 className="title">Roles & Permissions</h2>
          
          <div className="header-actions">
            <div className="search-filter">
              <div className="search-box">
                <span className="search-icon">
                  <FaSearch/>
                </span>
                <input 
                  type="text" 
                  placeholder="Search permissions"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-dropdown">
                <select 
                  value={filterBy} 
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowNewPermissionModal(true)}
              >
                + New Permission
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowNewRoleModal(true)}
              >
                + New Role
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading roles...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <FaExclamationCircle/>
            <p>{error}</p>
            <button onClick={fetchData} className="btn btn-secondary">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredResources.map(resource => (
          <div key={resource.name} className="forms-section">
            <div className="section-header">
              <h3>{resource.name}</h3>
            </div>

            {resource.permissions.map(permission => (
              <div key={permission.id} className="permission-row">
                <div className="permission-item">
                  <span className="permission-name">
                    {formatPermissionName(permission.name)}
                  </span>
                  <span className="sub-text">{permission.description}</span>
                </div>
                <div className="role-badges">
                  {rolesWithPermission(permission.id).map(role => (
                    <span 
                      key={role.id}
                      className="role-badge"
                      style={roleBadgeStyle(role)}
                    >
                      {role.name}
                    </span>
                  ))}
                  <button 
                    className="edit-btn"
                    onClick={() => openEditModal(permission)}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="edit-btn"
                    onClick={() => deletePer(permission.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        <CustomModal
          isVisible={showNewPermissionModal}
          title="Create New Permission"
          primaryText="Create Permission"
          cancelText="Cancel"
          loading={isLoading}
          loadingText="Creating..."
          primaryDisabled={!newPermission.name.trim() || !newPermission.resource.trim() || !newPermission.action.trim()}
          size="medium"
          onClose={closePermissionModal}
          onPrimaryAction={createPermission}
        >
          <div className="modal-form">
            <div className="form-group">
              <label htmlFor="permissionName">Permission Name</label>
              <input 
                id="permissionName"
                type="text" 
                value={newPermission.name}
                onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                placeholder="e.g., USER_CREATE, PRODUCT_READ"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="permissionDescription">Description</label>
              <textarea 
                id="permissionDescription"
                value={newPermission.description}
                onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                placeholder="Describe what this permission allows"
                className="form-textarea"
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="permissionResource">Resource</label>
              <select 
                value={newPermission.resource}
                onChange={(e) => setNewPermission({ ...newPermission, resource: e.target.value })}
                className="form-select" 
                id="permissionResource"
              >
                <option value="">Select Resource</option>
                {availableResources.map(resource => (
                  <option key={resource} value={resource}>
                    {resource}
                  </option>
                ))}
                <option value="custom">Custom Resource</option>
              </select>
              {newPermission.resource === 'custom' && (
                <input 
                  type="text" 
                  value={newPermission.customResource}
                  onChange={(e) => setNewPermission({ ...newPermission, customResource: e.target.value })}
                  placeholder="Enter custom resource name"
                  className="form-input mt-2"
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="permissionAction">Action</label>
              <select 
                value={newPermission.action}
                onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                className="form-select" 
                id="permissionAction"
              >
                <option value="">Select Action</option>
                <option value="CREATE">CREATE</option>
                <option value="READ">READ</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={newPermission.isActive}
                  onChange={(e) => setNewPermission({ ...newPermission, isActive: e.target.checked })}
                  className="form-checkbox"
                />
                Active Permission
              </label>
            </div>
          </div>
        </CustomModal>

        <CustomModal
          isVisible={showNewRoleModal}
          title="Create New Role"
          primaryText="Create Role"
          cancelText="Cancel"
          loading={isLoading}
          loadingText="Creating..."
          primaryDisabled={!newRole.name.trim()}
          size="large"
          onClose={closeModal}
          onPrimaryAction={createRole}
        >
          <div className="modal-form-grid">
            <div className="left-column">
              <div className="form-group">
                <label htmlFor="roleName">Role Name</label>
                <input 
                  id="roleName"
                  type="text" 
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Enter role name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="roleDescription">Description (Optional)</label>
                <textarea 
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe the role's purpose"
                  className="form-textarea"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Role Color</label>
                <div className="color-options">
                  {roleColors.map(color => (
                    <button 
                      key={color.name}
                      className={`color-option ${newRole.color === color.name ? 'selected' : ''}`}
                      style={{ 
                        backgroundColor: color.bg, 
                        borderColor: color.border, 
                        color: color.text 
                      }}
                      onClick={() => setNewRole({ ...newRole, color: color.name })}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="right-column">
              <div className="permissions-section">
                <h4>Permissions</h4>
                <p className="permissions-subtitle">
                  Select which permissions this role should have
                </p>

                <div className="permissions-list">
                  {groupedPermissions.map(resource => (
                    <div 
                      key={`modal-${resource.name}`}
                      className="permission-category"
                    >
                      <div className="category-header">
                        <input 
                          type="checkbox" 
                          id={`category-${resource.name}`}
                          checked={isCategorySelected(resource)}
                          onChange={(e) => toggleCategory(resource, e.target.checked)}
                          className="category-checkbox"
                        />
                        <label 
                          htmlFor={`category-${resource.name}`}
                          className="category-label"
                        >
                          {resource.name}
                        </label>
                      </div>

                      <div className="permission-items">
                        {resource.permissions.map(permission => (
                          <div 
                            key={permission.id}
                            className="permission-item-check"
                          >
                            <input 
                              type="checkbox" 
                              id={`perm-${permission.id}`}
                              value={permission.id}
                              checked={newRole.permissionIds.includes(permission.id)}
                              onChange={(e) => {
                                const updatedIds = e.target.checked
                                  ? [...newRole.permissionIds, permission.id]
                                  : newRole.permissionIds.filter(id => id !== permission.id);
                                setNewRole({ ...newRole, permissionIds: updatedIds });
                              }}
                              className="permission-checkbox"
                            />
                            <label 
                              htmlFor={`perm-${permission.id}`}
                              className="permission-label"
                            >
                              {formatPermissionName(permission.name)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CustomModal>

        {/* Edit Permission Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Permission: {editingPermission.name}</h3>
                <button className="close-btn" onClick={closeEditModal}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Assigned Roles</label>
                  <div className="role-assignments">
                    {roles.map(role => (
                      <div 
                        key={role.id}
                        className="role-assignment"
                      >
                        <input 
                          type="checkbox" 
                          id={`role-${role.id}`}
                          value={role.id}
                          checked={editingPermission.assignedRoles.includes(role.id)}
                          onChange={(e) => {
                            const updatedRoles = e.target.checked
                              ? [...editingPermission.assignedRoles, role.id]
                              : editingPermission.assignedRoles.filter(id => id !== role.id);
                            setEditingPermission({ ...editingPermission, assignedRoles: updatedRoles });
                          }}
                          className="role-checkbox"
                        />
                        <label 
                          htmlFor={`role-${role.id}`}
                          className="role-label"
                          style={roleBadgeStyle(role)}
                        >
                          {role.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeEditModal}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={updatePermission} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default RolesPermissions;