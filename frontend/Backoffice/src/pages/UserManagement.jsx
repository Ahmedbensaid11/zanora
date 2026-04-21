import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import * as adminApi from '../api/admin';
import CustomModal from '../components/CustomModal';
import SuccessAlert from '../components/SuccessAlert';
import ErrorAlert from '../components/ErrorAlert';
import { roleService } from "../api/roleService";
import '../styles/UserManagement.css';
import { FaEllipsisVertical } from 'react-icons/fa6';

const UserManagement = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState('list');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    role: '',
    username: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newUser, setNewUser] = useState({
    id: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    roleId: '',
    active: true
  });

  const roleColors = [
    { name: 'Blue', bg: '#e3f2fd', border: '#1976d2', text: '#1976d2' },
    { name: 'Green', bg: '#e8f5e8', border: '#2e7d32', text: '#2e7d32' },
    { name: 'Purple', bg: '#f3e5f5', border: '#7b1fa2', text: '#7b1fa2' },
    { name: 'Orange', bg: '#fff3e0', border: '#f57c00', text: '#f57c00' },
    { name: 'Red', bg: '#ffebee', border: '#c62828', text: '#c62828' },
    { name: 'Teal', bg: '#e0f2f1', border: '#00695c', text: '#00695c' }
  ];

  const handleMouseDown = (e) => {
    if (!tableRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableRef.current.offsetLeft);
    setScrollLeft(tableRef.current.scrollLeft);
    tableRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (tableRef.current) {
      tableRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !tableRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    tableRef.current.scrollLeft = scrollLeft - walk;
  };

  const isFormValid = () => {
    const baseValidation = (
      newUser.firstName.trim().length > 0 &&
      newUser.lastName.trim().length > 0 &&
      newUser.username.trim().length > 0 &&
      newUser.email.trim().length > 0 &&
      newUser.roleId !== null && newUser.roleId !== '' &&
      newUser.active !== null && newUser.active !== undefined
    );
    
    if (!isEditing) {
      return baseValidation && newUser.password.trim().length > 0;
    }
    
    return baseValidation;
  };

  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const visiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.fetchUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      setError('Failed to load users. Please try again.');
      if (error.response?.status === 403) {
        navigate('/access-denied');
      }
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 200);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await roleService.getAllRoles();
      setAvailableRoles(response.data);
    } catch (error) {
      console.error('Failed to load roles:', error);
      setErrorMessage('Failed to load roles');
      setShowError(true);
      if (error.response?.status === 403) {
        navigate('/access-denied');
      }
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const filterUsers = useCallback(() => {
    const filtered = users.filter(user => {
      const nameMatch = !filters.name || 
        `${user.firstName} ${user.lastName} ${user.username}`.toLowerCase().includes(filters.name.toLowerCase());

      const roleMatch = !filters.role || (user.role && user.role.name === filters.role);

      const usernameMatch = !filters.username || 
        (user.username && user.username.toLowerCase().includes(filters.username.toLowerCase()));

      return nameMatch && roleMatch && usernameMatch;
    });
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const saveUser = async () => {
    try {
      setError(null);
      setLoading(true);
      setShowSuccess(false);
      setShowError(false);
      
      const userData = {
        id: newUser.id,
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        username: newUser.username.trim(),
        email: newUser.email.trim(),
        active: newUser.active,
        role: newUser.roleId ? { id: newUser.roleId } : null
      };

      if (!isEditing && newUser.password.trim()) {
        userData.password = newUser.password;
      } else if (isEditing && newUser.password && newUser.password.trim()) {
        userData.password = newUser.password;
      }

      if (isEditing) {
        await adminApi.updateUser(userData.id, userData);
        setSuccessMessage('User updated successfully');
        setShowSuccess(true);
      } else {
        await adminApi.createUsers(userData);
        setSuccessMessage('User created successfully');
        setShowSuccess(true);
      }
      
      await loadUsers();
      closeModal();
    } catch (error) {
      console.error('Failed to save user:', error);
      if (error.response?.status === 403) {
        navigate('/access-denied');
      } else if (error.response?.data?.includes("[Violation of UNIQUE KEY") || 
          error.response?.data?.includes("UNIQUE KEY constraint")) {
        setErrorMessage("A user with this username or email already exists.");
      } else {
        setErrorMessage(error.response?.data || 'Failed to save user');
      }
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const editUser = (user) => {
    setIsEditing(true);
    setNewUser({
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      roleId: user.role ? user.role.id : '',
      active: user.active
    });
    setShowAddModal(true);
    setActiveDropdown(null);
  };

  const activateUser = async (user) => {
    try {
      setLoading(true);
      setShowSuccess(false);
      setShowError(false);
      await adminApi.activateUserApi(user.id, user);
      setSuccessMessage('User activated successfully');
      setShowSuccess(true);
      await loadUsers();
    } catch (error) {
      console.error('Failed to activate user:', error);
      if (error.response?.status === 403) {
        navigate('/access-denied');
      }
      setErrorMessage('Failed to activate user');
      setShowError(true);
    } finally {
      setLoading(false);
    }
    setActiveDropdown(null);
  };

  const deactivateUser = async (user) => {
    try {
      setShowSuccess(false);
      setShowError(false);
      setLoading(true);
      await adminApi.deactivateUserApi(user.id, user);
      setSuccessMessage('User deactivated successfully');
      setShowSuccess(true);
      await loadUsers();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      if (error.response?.status === 403) {
        navigate('/access-denied');
      }
      setErrorMessage('Failed to deactivate user');
      setShowError(true);
    } finally {
      setLoading(false);
    }
    setActiveDropdown(null);
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const deleteUser = async () => {
    try {
      setShowError(false);
      setShowSuccess(false);
      setLoading(true);
      await adminApi.deleteUsers(userToDelete.id);
      setSuccessMessage('User deleted successfully');
      setShowSuccess(true);
      await loadUsers();
      closeModal();
    } catch (error) {
      console.error('Failed to delete user:', error);
      if (error.response?.status === 403) {
        navigate('/access-denied');
      }
      setErrorMessage('Failed to delete user');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const roleBadgeStyle = (user) => {
    const color = roleColors.find(c => c.name.toLowerCase() === user.role?.color?.toLowerCase()) || 
                 roleColors[0];
    return {
      backgroundColor: color.bg,
      border: `1px solid ${color.border}`,
      color: color.text
    };
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowDeleteModal(false);
    setIsEditing(false);
    setUserToDelete(null);
    resetNewUser();
  };

  const resetNewUser = () => {
    setNewUser({
      id: '',
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      roleId: '',
      active: true
    });
  };

  const toggleDropdown = (userId) => {
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleNewUserChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  return (
      <div className="container">
        <div className="content">
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

          <div className="row">
            <div className="col-xs-4">
              <div className="header">
                <h2>Users Management</h2>
              </div>
            </div>
            <div className="col-xs-8 text-right m-b-30">
              
              <button 
                className="btn btn-primary rounded" 
                onClick={() => setShowAddModal(true)}
              >
                <i className="fa fa-plus"></i> Add User
              </button>
            </div>
          </div>

          <div className="row filter-row">
            <div className="col-sm-3 col-xs-6">
              <div className="form-group1">
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Username"
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                />
              </div>
            </div>
            <div className="col-sm-3 col-xs-6">
              <div className="form-group1">
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="User lastName or first Name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>
            </div>
            <div className="col-sm-3 col-xs-6">
              <div className="form-group1">
                <select 
                  className="form-control"
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="">Select Role</option>
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-sm-3 col-xs-6">
              <button 
                className="btn btn-success btn-block search-btn" 
                onClick={filterUsers}
              >
                SEARCH
              </button>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              {loading && (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Loading users...</p>
                </div>
              )}

              {error && !loading && (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>{error}</p>
                  <button onClick={loadUsers} className="btn btn-secondary-error">
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && (
                <>
                  <div 
                    className="table-wrapper"
                    ref={tableRef}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    style={{
                      overflowX: 'hidden',
                      cursor: 'grab',
                      userSelect: 'none'
                    }}
                  >
                    <table className="table table-striped custom-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Join Date</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map(user => (
                          <tr key={user.id}>
                            <td>
                              <div className="user-info">
                                <div className="avatar">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                  <h4>{user.firstName} {user.lastName}</h4>
                                  <span>{user.username}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong>
                                {user.username || 'USR-' + String(user.id).padStart(4, '0')}
                              </strong>
                            </td>
                            <td>
                              <a href="#" className="email-link">{user.email}</a>
                            </td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td>
                              {user.role ? (
                                <span className="role-badge" style={roleBadgeStyle(user)}>
                                  {user.role.name}
                                </span>
                              ) : (
                                <span className="role-badge role-default">No Role</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${user.active ? 'status-active' : 'status-inactive'}`}>
                                {user.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="dropdown">
                                <button 
                                  className="btn btn-link action-icon dropdown-toggle" 
                                  onClick={() => toggleDropdown(user.id)}
                                >
                                  <FaEllipsisVertical />
                                </button>
                                <ul 
                                  className={`dropdown-menu pull-right ${activeDropdown === user.id ? 'show' : ''}`}
                                >
                                  <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); editUser(user); }}>
                                      <i className="fa fa-pencil m-r-5"></i> Edit
                                    </a>
                                  </li>
                                  {user.active ? (
                                    <li>
                                      <a href="#" onClick={(e) => { e.preventDefault(); deactivateUser(user); }}>
                                        <i className="fa fa-ban m-r-5"></i> Deactivate
                                      </a>
                                    </li>
                                  ) : (
                                    <li>
                                      <a href="#" onClick={(e) => { e.preventDefault(); activateUser(user); }}>
                                        <i className="fa fa-check m-r-5"></i> Activate
                                      </a>
                                    </li>
                                  )}
                                  <li>
                                    <a href="#" onClick={(e) => { e.preventDefault(); confirmDelete(user); }}>
                                      <i className="fa fa-trash-o m-r-5"></i> Delete
                                    </a>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pagination-container">
                    <div className="pagination-info">
                      Showing {startIndex + 1} to {endIndex} of {totalUsers} users
                    </div>
                    <div className="pagination-controls">
                      <button 
                        className="pagination-btn"
                        disabled={currentPage === 1}
                        onClick={() => goToPage(1)}
                      >
                        <ChevronsLeft size={16} />
                      </button>
                      <button 
                        className="pagination-btn"
                        disabled={currentPage === 1}
                        onClick={() => goToPage(currentPage - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      {visiblePages().map(page => (
                        <button 
                          key={page}
                          className={`pagination-btn page-number ${currentPage === page ? 'active' : ''}`}
                          onClick={() => goToPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button 
                        className="pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => goToPage(currentPage + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button 
                        className="pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => goToPage(totalPages)}
                      >
                        <ChevronsRight size={16} />
                      </button>
                    </div>
                    <div className="items-per-page">
                      <label>Items per page:</label>
                      <select 
                        value={itemsPerPage} 
                        onChange={onItemsPerPageChange} 
                        className="page-size-select"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <CustomModal
          isVisible={showAddModal}
          title={isEditing ? 'Edit User' : 'Add User'}
          primaryText="Save User"
          loading={loading}
          loadingText={loading ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
          primaryDisabled={!isFormValid()}
          size="large"
          onClose={closeModal}
          onPrimaryAction={saveUser}
        >
          <form className="user-form">
            <div className="form-section">
              <div className="section-header">
                <h5 className="section-title">
                  <i className="fas fa-user"></i>
                  Personal Information
                </h5>
              </div>
              
              <div className="form-grid">
                <div className="form-group1">
                  <label className="form-label required">First Name</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    value={newUser.firstName}
                    onChange={(e) => handleNewUserChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                
                <div className="form-group1">
                  <label className="form-label required">Last Name</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    value={newUser.lastName}
                    onChange={(e) => handleNewUserChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header">
                <h5 className="section-title">
                  <i className="fas fa-cog"></i>
                  Account Information
                </h5>
              </div>
              
              <div className="form-grid">
                <div className="form-group1">
                  <label className="form-label required">Username</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    value={newUser.username}
                    onChange={(e) => handleNewUserChange('username', e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
                
                <div className="form-group1">
                  <label className="form-label required">Email Address</label>
                  <input 
                    className="form-input" 
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => handleNewUserChange('email', e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div className="form-group1">
                  <label className={`form-label ${!isEditing ? 'required' : ''}`}>
                    Password
                  </label>
                  <input 
                    className="form-input" 
                    type="password" 
                    value={newUser.password}
                    onChange={(e) => handleNewUserChange('password', e.target.value)}
                    required={!isEditing}
                    placeholder={isEditing ? 'Leave blank to keep current' : 'Enter secure password'}
                  />
                  {isEditing && (
                    <small className="form-hint">
                      Leave blank to keep current password
                    </small>
                  )}
                </div>
                
                <div className="form-group1">
                  <label className="form-label required">Role</label>
                  <select 
                    className="form-input form-select" 
                    value={newUser.roleId}
                    onChange={(e) => handleNewUserChange('roleId', e.target.value)}
                    required
                  >
                    <option value="">Select a role</option>
                    {availableRoles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group1">
                  <label className="form-label">Account Status</label>
                  <select 
                    className="form-input form-select" 
                    value={newUser.active}
                    onChange={(e) => handleNewUserChange('active', e.target.value === 'true')}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </CustomModal>

        <CustomModal
          isVisible={showDeleteModal}
          title="Delete User"
          primaryText="Delete"
          cancelText="Cancel"
          loading={loading}
          loadingText="Deleting..."
          size="small"
          onClose={closeModal}
          onPrimaryAction={deleteUser}
          danger
        >
          <p>Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}?</p>
          <p className="text-muted">This action cannot be undone.</p>
        </CustomModal>
      </div>
  );
};

export default UserManagement;