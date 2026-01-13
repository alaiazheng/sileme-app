import { useState, useEffect, useContext, createContext } from 'react'
import { authAPI, apiClient } from '../config/api'

// 创建认证上下文
const AuthContext = createContext()

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 检查本地存储的token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      apiClient.setToken(token)
      // 验证token有效性
      checkAuthStatus()
    } else {
      setLoading(false)
    }
  }, [])

  // 检查认证状态
  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.getMe()
      setUser(response.data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('认证检查失败:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  // 登录
  const login = async (credentials) => {
    try {
      setLoading(true)
      const response = await authAPI.login(credentials)
      
      const { token, user: userData } = response.data
      
      // 保存token和用户信息
      apiClient.setToken(token)
      setUser(userData)
      setIsAuthenticated(true)
      
      return { success: true, user: userData }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // 注册
  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authAPI.register(userData)
      
      const { token, user: newUser } = response.data
      
      // 保存token和用户信息
      apiClient.setToken(token)
      setUser(newUser)
      setIsAuthenticated(true)
      
      return { success: true, user: newUser }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // 登出
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      // 清除本地状态
      apiClient.setToken(null)
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  // 更新用户信息
  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }))
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 使用认证Hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default useAuth