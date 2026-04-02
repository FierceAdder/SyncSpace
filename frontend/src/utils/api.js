const BASE_URL = 'http://localhost:3000';

const getHeaders = (auth = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('ss_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
};

// User
export const register = (body) =>
  fetch(`${BASE_URL}/user/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const login = (body) =>
  fetch(`${BASE_URL}/user/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const getProfile = () =>
  fetch(`${BASE_URL}/user/profile`, { headers: getHeaders(true) }).then(handleResponse);

export const updateUsername = (body) =>
  fetch(`${BASE_URL}/user/update-username`, { method: 'PUT', headers: getHeaders(true), body: JSON.stringify(body) }).then(handleResponse);

export const updatePassword = (body) =>
  fetch(`${BASE_URL}/user/update-password`, { method: 'PUT', headers: getHeaders(true), body: JSON.stringify(body) }).then(handleResponse);

// Groups
export const createGroup = (body) =>
  fetch(`${BASE_URL}/groups/create`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(body) }).then(handleResponse);

export const joinGroup = (body) =>
  fetch(`${BASE_URL}/groups/join`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(body) }).then(handleResponse);

export const deleteGroup = (groupId) =>
  fetch(`${BASE_URL}/groups/${groupId}/delete`, { method: 'DELETE', headers: getHeaders(true) }).then(handleResponse);

export const leaveGroup = (groupId) =>
  fetch(`${BASE_URL}/groups/${groupId}/leave`, { method: 'PUT', headers: getHeaders(true) }).then(handleResponse);

// NEW
export const getMyGroups = () =>
  fetch(`${BASE_URL}/groups/mine`, { headers: getHeaders(true) }).then(handleResponse);

export const getGroupDetails = (groupId) =>
  fetch(`${BASE_URL}/groups/${groupId}`, { headers: getHeaders(true) }).then(handleResponse);

export const getGroupMembers = (groupId) =>
  fetch(`${BASE_URL}/groups/${groupId}/members`, { headers: getHeaders(true) }).then(handleResponse);

export const kickMember = (groupId, memberId) =>
  fetch(`${BASE_URL}/groups/${groupId}/members/${memberId}`, { method: 'DELETE', headers: getHeaders(true) }).then(handleResponse);

export const regenerateJoinCode = (groupId) =>
  fetch(`${BASE_URL}/groups/${groupId}/regenerate-code`, { method: 'PUT', headers: getHeaders(true) }).then(handleResponse);

// Resources
export const addResource = (body) =>
  fetch(`${BASE_URL}/resources/add`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(body) }).then(handleResponse);

export const getGroupResources = (groupId) =>
  fetch(`${BASE_URL}/resources/${groupId}`, { headers: getHeaders(true) }).then(handleResponse);

export const upvoteResource = (resourceId) =>
  fetch(`${BASE_URL}/resources/${resourceId}/upvote`, { method: 'PUT', headers: getHeaders(true) }).then(handleResponse);

export const downvoteResource = (resourceId) =>
  fetch(`${BASE_URL}/resources/${resourceId}/downvote`, { method: 'PUT', headers: getHeaders(true) }).then(handleResponse);

export const deleteResource = (resourceId) =>
  fetch(`${BASE_URL}/resources/${resourceId}`, { method: 'DELETE', headers: getHeaders(true) }).then(handleResponse);

export const getRecentResources = () =>
  fetch(`${BASE_URL}/resources/recents`, { headers: getHeaders(true) }).then(handleResponse);

export const searchResources = (q) =>
  fetch(`${BASE_URL}/resources/search?q=${encodeURIComponent(q)}`, { headers: getHeaders(true) }).then(handleResponse);