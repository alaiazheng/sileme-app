// API配置
const getApiBaseUrl = () => {
  // 生产环境使用环境变量或默认值
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://sileme-backend.onrender.com/api'
  }
  // 开发环境使用本地地址
  return import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
}

const API_BASE_URL = getApiBaseUrl()

// API端点
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh'
  },
  
  // 用户相关
  USERS: {
    PROFILE: '/users/profile',
    SETTINGS: '/users/settings',
    EMERGENCY_CONTACTS: '/users/emergency-contacts',
    STATS: '/users/stats',
    EXPORT: '/users/export'
  },
  
  // 打卡相关
  CHECKINS: {
    BASE: '/checkins',
    TODAY_STATUS: '/checkins/today/status',
    STATS: '/checkins/stats',
    CALENDAR: (year, month) => `/checkins/calendar/${year}/${month}`
  },
  
  // 通知相关
  NOTIFICATIONS: {
    BASE: '/notifications',
    READ: (id) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all'
  },
  
  // 统计相关
  STATS: {
    OVERVIEW: '/stats/overview',
    TRENDS: '/stats/checkin-trends',
    MONTHLY_REPORT: (year, month) => `/stats/monthly-report/${year}/${month}`,
    ACHIEVEMENTS: '/stats/achievements'
  },
  
  // 数据管理
  DATA: {
    EXPORT: '/data/export',
    IMPORT: '/data/import',
    VALIDATE: '/data/validate',
    CLEAR_ALL: '/data/clear-all'
  }
}

// HTTP客户端配置
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem('token')
  }

  // 设置认证令牌
  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  // 获取请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    return headers
  }

  // 处理响应
  async handleResponse(response) {
    const data = await response.json()
    
    if (!response.ok) {
      // 处理认证错误
      if (response.status === 401) {
        this.setToken(null)
        window.location.href = '/login'
      }
      
      throw new Error(data.message || '请求失败')
    }
    
    return data
  }

  // GET请求
  async get(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse(response)
  }

  // POST请求
  async post(endpoint, data = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    return this.handleResponse(response)
  }

  // PUT请求
  async put(endpoint, data = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    return this.handleResponse(response)
  }

  // DELETE请求
  async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    return this.handleResponse(response)
  }

  // 文件上传
  async upload(endpoint, formData) {
    const headers = {}
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    })
    
    return this.handleResponse(response)
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient()

// API服务函数
export const authAPI = {
  register: (userData) => apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  login: (credentials) => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  logout: () => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  getMe: () => apiClient.get(API_ENDPOINTS.AUTH.ME),
  refresh: () => apiClient.post(API_ENDPOINTS.AUTH.REFRESH)
}

export const userAPI = {
  updateProfile: (profileData) => apiClient.put(API_ENDPOINTS.USERS.PROFILE, profileData),
  updateSettings: (settings) => apiClient.put(API_ENDPOINTS.USERS.SETTINGS, settings),
  addEmergencyContact: (contact) => apiClient.post(API_ENDPOINTS.USERS.EMERGENCY_CONTACTS, contact),
  getStats: () => apiClient.get(API_ENDPOINTS.USERS.STATS),
  exportData: () => apiClient.get(API_ENDPOINTS.USERS.EXPORT)
}

export const checkinAPI = {
  create: (checkinData) => apiClient.post(API_ENDPOINTS.CHECKINS.BASE, checkinData),
  getList: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiClient.get(`${API_ENDPOINTS.CHECKINS.BASE}${query ? `?${query}` : ''}`)
  },
  getTodayStatus: () => apiClient.get(API_ENDPOINTS.CHECKINS.TODAY_STATUS),
  getStats: () => apiClient.get(API_ENDPOINTS.CHECKINS.STATS),
  getCalendar: (year, month) => apiClient.get(API_ENDPOINTS.CHECKINS.CALENDAR(year, month))
}

export const notificationAPI = {
  create: (notificationData) => apiClient.post(API_ENDPOINTS.NOTIFICATIONS.BASE, notificationData),
  getList: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}${query ? `?${query}` : ''}`)
  },
  markAsRead: (id) => apiClient.put(API_ENDPOINTS.NOTIFICATIONS.READ(id)),
  markAllAsRead: () => apiClient.put(API_ENDPOINTS.NOTIFICATIONS.READ_ALL),
  delete: (id) => apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}`)
}

export const statsAPI = {
  getOverview: () => apiClient.get(API_ENDPOINTS.STATS.OVERVIEW),
  getTrends: () => apiClient.get(API_ENDPOINTS.STATS.TRENDS),
  getMonthlyReport: (year, month) => apiClient.get(API_ENDPOINTS.STATS.MONTHLY_REPORT(year, month)),
  getAchievements: () => apiClient.get(API_ENDPOINTS.STATS.ACHIEVEMENTS)
}

export const dataAPI = {
  export: () => apiClient.get(API_ENDPOINTS.DATA.EXPORT),
  import: (data) => apiClient.post(API_ENDPOINTS.DATA.IMPORT, data),
  validate: (data) => apiClient.post(API_ENDPOINTS.DATA.VALIDATE, data),
  clearAll: () => apiClient.delete(API_ENDPOINTS.DATA.CLEAR_ALL)
}

export default apiClient