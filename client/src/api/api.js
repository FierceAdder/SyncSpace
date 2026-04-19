const API_BASE =  import.meta.env.VITE_API_BASE || '';


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

// Multipart request (no Content-Type header — let browser set boundary)
async function requestMultipart(endpoint, formData) {
  const token = localStorage.getItem('syncspace_token');
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
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
  updateProfile: (About) => request('/user/update-profile', { method: 'PUT', body: JSON.stringify({ About }) }),
  updateAvatar: (fileName, contentType) => request('/user/update-avatar', { method: 'PUT', body: JSON.stringify({ fileName, contentType }) }),
  getGroupsDetail: () => request('/user/groups-detail'),
  
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
  searchResources: (query, sort = 'relevance') => request(`/resources/search?q=${encodeURIComponent(query)}&sort=${sort}`),
  upvoteResource: (resourceId) => request(`/resources/${resourceId}/upvote`, { method: 'PUT' }),
  downvoteResource: (resourceId) => request(`/resources/${resourceId}/downvote`, { method: 'PUT' }),
  deleteResource: (resourceId) => request(`/resources/${resourceId}`, { method: 'DELETE' }),
  
  // File upload (S3 presigned URLs)
  getPresignedUploadUrl: (fileName, contentType, groupId) => 
    request('/resources/presign-upload', { method: 'POST', body: JSON.stringify({ fileName, contentType, groupId }) }),
  getPresignedDownloadUrl: (resourceId) => request(`/resources/${resourceId}/presign-download`),
  
  // Upload file directly to S3 via presigned URL
  uploadToS3: async (presignedUrl, file, contentType, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }
      
      xhr.onload = () => {
        if (xhr.status === 200) resolve();
        else reject(new Error('Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(file);
    });
  },
  
  // Comments
  getResourceComments: (resourceId) => request(`/comments/${resourceId}`),
  addComment: (resourceId, content) => request(`/comments/${resourceId}`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteComment: (commentId) => request(`/comments/${commentId}`, { method: 'DELETE' }),
  
  // Feedback
  submitFeedback: (body) => request('/feedback', { method: 'POST', body: JSON.stringify(body) }),
  getMyFeedback: () => request('/feedback/mine'),

  // Public stats (no auth)
  getPublicStats: () => fetch(`${API_BASE}/stats`).then(r => r.json()).catch(() => ({ users: 0, groups: 0, resources: 0 })),
};

export default api;
