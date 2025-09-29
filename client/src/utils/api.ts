import axios from 'axios';

// Get API URL (set at build-time via Docker build args)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Validate that API URL is available
if (!API_URL) {
    throw new Error('❌ FEHLER: NEXT_PUBLIC_API_URL Umgebungsvariable ist nicht gesetzt!\n   Bitte setze NEXT_PUBLIC_API_URL in der .env Datei (z.B. NEXT_PUBLIC_API_URL=http://localhost/api)');
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Issue {
  id: number;
  title: string;
  description: string;
  category: string;
  location?: string;
  issue_type: 'communal' | 'state' | 'federal';
  status: 'pending_approval' | 'submitted' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  approved_at?: string;
  rejected_at?: string;
  vote_count: number;
  has_attachment?: boolean;
  has_voted?: boolean;
  is_anonymous?: boolean;
  submitter_name?: string;
  submitter_email?: string;
  submitter_contact?: string;
  admin_notes?: string;
}

export interface IssueSubmission {
  title: string;
  description: string;
  category: string;
  location?: string;
  issue_type: 'communal' | 'state' | 'federal';
  is_anonymous: boolean;
  submitter_name?: string;
  submitter_email?: string;
  submitter_contact?: string;
  attachment?: File;
}

export interface PublicStats {
  totalIssues: number;
  resolvedIssues: number;
  totalVotes: number;
  recentlyResolved: number;
  successRate: number;
  topCategories: Array<{ category: string; count: number }>;
}

export interface Category {
  value: string;
  label: string;
  labelEn: string;
}

export interface IssueType {
  value: string;
  label: string;
  labelEn: string;
}

// API Functions

// Public APIs
export const getPublicStats = async (): Promise<PublicStats> => {
  const response = await api.get('/public/stats');
  return response.data;
};

export const getTopIssues = async (limit = 10): Promise<{ issues: Issue[] }> => {
  const response = await api.get('/public/top-issues', { params: { limit } });
  return response.data;
};

export const getRecentResolved = async (limit = 5): Promise<{ issues: Issue[] }> => {
  const response = await api.get('/public/recent-resolved', { params: { limit } });
  return response.data;
};

export const getCategories = async (): Promise<{ categories: Category[] }> => {
  const response = await api.get('/public/categories');
  return response.data;
};

export const getIssueTypes = async (): Promise<{ issueTypes: IssueType[] }> => {
  const response = await api.get('/public/issue-types');
  return response.data;
};

// Issues APIs
export const getIssues = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  sort?: string;
  order?: string;
  search?: string;
  approved?: string; // 'pending', 'approved', 'all' - nur für Admins
}): Promise<{
  issues: Issue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  // Verwende den einheitlichen /issues Endpunkt für alle Anfragen
  const response = await api.get('/issues', { params });
  return response.data;
};

export const getIssue = async (id: number): Promise<{
  issue: Issue;
  updates: Array<{
    id: number;
    update_text: string;
    updated_by: string;
    updater_name: string;
    created_at: string;
  }>;
}> => {
  const response = await api.get(`/issues/${id}`);
  return response.data;
};

export const submitIssue = async (issueData: IssueSubmission): Promise<{
  message: string;
  issueId: number;
  status: string;
}> => {
  const formData = new FormData();
  
  // Clean data and only add non-empty values
  Object.entries(issueData).forEach(([key, value]) => {
    if (key !== 'attachment' && value !== undefined && value !== null) {
      // Skip empty strings for optional fields
      if (typeof value === 'string' && value.trim() === '') {
        return;
      }
      
      // Convert boolean to string properly
      if (typeof value === 'boolean') {
        formData.append(key, value.toString());
      } else {
        formData.append(key, String(value).trim());
      }
    }
  });
  
  // Add file if present
  if (issueData.attachment) {
    formData.append('attachment', issueData.attachment);
  }
  
  // Debug: Log FormData contents (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('FormData contents:');
    const entries = Array.from(formData.entries());
    entries.forEach(([key, value]) => {
      console.log(key, value);
    });
  }
  
  try {
    const response = await api.post('/issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    // Enhanced error logging
    if (error.response?.data?.details) {
      console.error('Validation errors:', error.response.data.details);
      throw new Error(`Validation failed: ${error.response.data.details.join(', ')}`);
    }
    throw error;
  }
};

// Voting APIs
export const voteForIssue = async (issueId: number): Promise<{
  message: string;
  voteCount: number;
}> => {
  const response = await api.post(`/votes/${issueId}`);
  return response.data;
};

export const removeVote = async (issueId: number): Promise<{
  message: string;
  voteCount: number;
}> => {
  const response = await api.delete(`/votes/${issueId}`);
  return response.data;
};

// Admin APIs
export const adminLogin = async (credentials: {
  username: string;
  password: string;
}): Promise<{
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}> => {
  const response = await api.post('/admin/login', credentials);
  return response.data;
};

export const getAdminStats = async (): Promise<{
  totalIssues: number;
  pendingApproval: number;
  approvedIssues: number;
  resolvedIssues: number;
  totalVotes: number;
  recentIssues: number;
  issuesByCategory: Array<{ category: string; count: number }>;
  issuesByStatus: Array<{ status: string; count: number }>;
}> => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// Admin issue management APIs
export const approveIssue = async (issueId: number, notes?: string): Promise<{
  message: string;
}> => {
  const response = await api.post(`/issues/admin/${issueId}/approve`, { notes });
  return response.data;
};

export const rejectIssue = async (issueId: number, reason?: string): Promise<{
  message: string;
}> => {
  const response = await api.delete(`/issues/admin/${issueId}/reject`, { 
    data: { reason } 
  });
  return response.data;
};

export const updateIssueStatus = async (issueId: number, status: string, updateText?: string): Promise<{
  message: string;
  issue: Issue;
}> => {
  const response = await api.put(`/admin/issues/${issueId}/status`, {
    status,
    update_text: updateText
  });
  return response.data;
};

export const reactivateIssue = async (issueId: number): Promise<{
  message: string;
  issue: Issue;
}> => {
  const response = await api.post(`/admin/issues/${issueId}/reactivate`);
  return response.data;
};

export const deleteIssue = async (issueId: number, reason?: string): Promise<{
  message: string;
}> => {
  const response = await api.delete(`/issues/admin/${issueId}/delete`, {
    data: { reason }
  });
  return response.data;
};

// Check if current user is admin
export const checkAdminStatus = async (): Promise<{
  isAdmin: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { isAdmin: false };
    }
    
    const response = await api.get('/admin/me');
    return { 
      isAdmin: true, 
      user: response.data.user 
    };
  } catch {
    // If request fails, user is not admin
    localStorage.removeItem('auth_token');
    return { isAdmin: false };
  }
};

// Add an update to an issue (admin only)
export const addIssueUpdate = async (issueId: number, updateText: string, isPublic = true): Promise<{
  message: string;
  update: {
    id: number;
    update_text: string;
    updated_by: string;
    updater_name: string;
    created_at: string;
    is_public: boolean;
  };
}> => {
  const response = await api.post(`/admin/issues/${issueId}/update`, {
    update_text: updateText,
    is_public: isPublic
  });
  return response.data;
};

export default api; 