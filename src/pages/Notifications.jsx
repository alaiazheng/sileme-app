import React, { useState } from 'react'
import { Bell, AlertTriangle, CheckCircle, Info, X, Plus, Send } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const notificationTypes = {
  emergency: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  warning: { icon: Bell, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' }
}

export default function Notifications() {
  const { state, dispatch } = useApp()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info'
  })
  
  const handleMarkAsRead = (notificationId) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId })
  }
  
  const handleCreateNotification = () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) return
    
    const notification = {
      id: Date.now().toString(),
      title: newNotification.title.trim(),
      message: newNotification.message.trim(),
      type: newNotification.type,
      date: new Date().toISOString(),
      read: false
    }
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
    setNewNotification({ title: '', message: '', type: 'info' })
    setShowCreateForm(false)
  }
  
  const unreadNotifications = state.notifications.filter(n => !n.read)
  const readNotifications = state.notifications.filter(n => n.read)
  
  return (
    <div className="p-4 space-y-4">
      {/* 头部统计 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">通知中心</h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-2 bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{unreadNotifications.length}</div>
            <div className="text-xs text-gray-500">未读消息</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{readNotifications.length}</div>
            <div className="text-xs text-gray-500">已读消息</div>
          </div>
        </div>
      </div>
      
      {/* 创建通知表单 */}
      {showCreateForm && (
        <div className="bg-white rounded-xl p-4 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">创建通知</h4>
            <button
              onClick={() => setShowCreateForm(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
              <input
                type="text"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                placeholder="输入通知标题"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
                maxLength="50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
              <textarea
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                placeholder="输入通知内容"
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
                rows="3"
                maxLength="200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
              <select
                value={newNotification.type}
                onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
              >
                <option value="info">普通消息</option>
                <option value="warning">重要提醒</option>
                <option value="emergency">紧急通知</option>
                <option value="success">成功消息</option>
              </select>
            </div>
            
            <button
              onClick={handleCreateNotification}
              disabled={!newNotification.title.trim() || !newNotification.message.trim()}
              className="w-full bg-brand-green text-white font-medium py-3 rounded-lg hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>发送通知</span>
            </button>
          </div>
        </div>
      )}
      
      {/* 未读通知 */}
      {unreadNotifications.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">未读消息</h4>
          {unreadNotifications.map((notification) => {
            const typeConfig = notificationTypes[notification.type] || notificationTypes.info
            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-4 card-shadow border-l-4 ${typeConfig.border} ${typeConfig.bg}`}
              >
                <div className="flex items-start space-x-3">
                  <typeConfig.icon className={`w-5 h-5 mt-0.5 ${typeConfig.color}`} />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{notification.title}</h5>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {format(new Date(notification.date), 'MM月dd日 HH:mm', { locale: zhCN })}
                      </span>
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-brand-green hover:text-brand-green-dark font-medium"
                      >
                        标记已读
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* 已读通知 */}
      {readNotifications.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">已读消息</h4>
          {readNotifications.slice(0, 10).map((notification) => {
            const typeConfig = notificationTypes[notification.type] || notificationTypes.info
            return (
              <div
                key={notification.id}
                className="bg-white rounded-xl p-4 card-shadow opacity-60"
              >
                <div className="flex items-start space-x-3">
                  <typeConfig.icon className={`w-5 h-5 mt-0.5 ${typeConfig.color}`} />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{notification.title}</h5>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <span className="text-xs text-gray-400">
                      {format(new Date(notification.date), 'MM月dd日 HH:mm', { locale: zhCN })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* 空状态 */}
      {state.notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无通知</h3>
          <p className="text-gray-500 mb-4">点击右上角按钮创建第一条通知</p>
        </div>
      )}
    </div>
  )
}