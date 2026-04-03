const API_BASE = 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('syncspace_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, message: data.message || 'Something went wrong' };
  }

  return data;
}

const api = {
  // Auth
  register: (body) => request('/user/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/user/login', { method: 'POST', body: JSON.stringify(body) }),
  
  // Profile
  getProfile: () => request('/user/profile'),
  updateUsername: (newUsername) => request('/user/update-username', { method: 'PUT', body: JSON.stringify({ newUsername }) }),
  updatePassword: (oldPassword, newPassword) => request('/user/update-password', { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword }) }),
  
  // Groups
  createGroup: (Group_Name, Description = '') => request('/groups/create', { method: 'POST', body: JSON.stringify({ Group_Name, Description }) }),
  joinGroup: (Join_Code) => request('/groups/join', { method: 'POST', body: JSON.stringify({ Join_Code }) }),
  getMyGroups: () => request('/groups/mine'),
  getGroup: (groupId) => request(`/groups/${groupId}`),
  deleteGroup: (groupId) => request(`/groups/${groupId}/delete`, { method: 'DELETE' }),
  leaveGroup: (groupId) => request(`/groups/${groupId}/leave`, { method: 'PUT' }),
  getMembers: (groupId) => request(`/groups/${groupId}/members`),
  removeMember: (groupId, memberId) => request(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' }),
  regenerateCode: (groupId) => request(`/groups/${groupId}/regenerate-code`, { method: 'PUT' }),
  updateGroup: (groupId, body) => request(`/groups/${groupId}/update`, { method: 'PUT', body: JSON.stringify(body) }),
  
  // Resources
  addResource: (body) => request('/resources/add', { method: 'POST', body: JSON.stringify(body) }),
  getGroupResources: (groupId) => request(`/resources/${groupId}`),
  getRecentResources: () => request('/resources/recents'),
  searchResources: (query) => request(`/resources/search?q=${encodeURIComponent(query)}`),
  upvoteResource: (resourceId) => request(`/resources/${resourceId}/upvote`, { method: 'PUT' }),
  downvoteResource: (resourceId) => request(`/resources/${resourceId}/downvote`, { method: 'PUT' }),
  deleteResource: (resourceId) => request(`/resources/${resourceId}`, { method: 'DELETE' }),
};

export default api;
