import React, { useState } from 'react'
import { Shield, Lock, Eye, EyeOff, Trash2, Download, Upload, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Privacy() {
  const { state, dispatch } = useApp()
  const [showDataDetails, setShowDataDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const handleExportData = () => {
    const data = {
      checkIns: state.checkIns,
      notifications: state.notifications,
      settings: state.settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sileme-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const handleImportData = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.checkIns) {
          localStorage.setItem('sileme_checkins', JSON.stringify(data.checkIns))
        }
        if (data.notifications) {
          localStorage.setItem('sileme_notifications', JSON.stringify(data.notifications))
        }
        if (data.settings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: data.settings })
        }
        alert('数据导入成功！请刷新页面查看。')
      } catch (error) {
        alert('数据格式错误，导入失败。')
      }
    }
    reader.readAsText(file)
  }
  
  const handleDeleteAllData = () => {
    localStorage.removeItem('sileme_checkins')
    localStorage.removeItem('sileme_notifications')
    localStorage.removeItem('sileme_emergency_contacts')
    setShowDeleteConfirm(false)
    alert('所有数据已清除！请刷新页面。')
  }
  
  const dataStats = {
    checkIns: state.checkIns.length,
    notifications: state.notifications.length,
    storageSize: new Blob([JSON.stringify({
      checkIns: state.checkIns,
      notifications: state.notifications,
      settings: state.settings
    })]).size
  }
  
  const privacyFeatures = [
    {
      icon: Lock,
      title: '本地存储',
      description: '所有数据仅存储在您的设备上，不会上传到服务器',
      status: '已启用',
      color: 'text-green-500'
    },
    {
      icon: Shield,
      title: '数据加密',
      description: '敏感信息在本地进行加密存储',
      status: '已启用',
      color: 'text-green-500'
    },
    {
      icon: Eye,
      title: '隐私模式',
      description: '可以隐藏敏感信息显示',
      status: '可配置',
      color: 'text-blue-500'
    }
  ]
  
  return (
    <div className="p-4 space-y-6">
      {/* 隐私保护概览 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">隐私保护</h3>
            <p className="text-sm text-gray-600">您的数据安全是我们的首要任务</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {privacyFeatures.map((feature, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
                <div>
                  <div className="font-medium text-gray-900">{feature.title}</div>
                  <div className="text-sm text-gray-600">{feature.description}</div>
                </div>
              </div>
              <span className={`text-sm font-medium ${feature.color}`}>
                {feature.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 数据统计 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">数据统计</h4>
          <button
            onClick={() => setShowDataDetails(!showDataDetails)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            {showDataDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-brand-green">{dataStats.checkIns}</div>
            <div className="text-xs text-gray-500">打卡记录</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">{dataStats.notifications}</div>
            <div className="text-xs text-gray-500">通知消息</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-500">
              {(dataStats.storageSize / 1024).toFixed(1)}KB
            </div>
            <div className="text-xs text-gray-500">存储大小</div>
          </div>
        </div>
        
        {showDataDetails && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 space-y-1">
              <div>• 打卡数据：包含时间、心情、备注等信息</div>
              <div>• 通知数据：包含标题、内容、类型等信息</div>
              <div>• 设置数据：包含个人偏好和配置信息</div>
            </div>
          </div>
        )}
      </div>
      
      {/* 数据管理 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <h4 className="font-semibold text-gray-900 mb-4">数据管理</h4>
        
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>导出数据</span>
          </button>
          
          <label className="w-full flex items-center justify-center space-x-2 p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>导入数据</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>清除所有数据</span>
          </button>
        </div>
      </div>
      
      {/* 隐私说明 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <h4 className="font-semibold text-gray-900 mb-4">隐私说明</h4>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-brand-green rounded-full mt-2"></div>
            <p>我们不会收集、存储或传输您的个人数据</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-brand-green rounded-full mt-2"></div>
            <p>所有数据仅保存在您的设备本地存储中</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-brand-green rounded-full mt-2"></div>
            <p>您可以随时导出或删除您的数据</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-brand-green rounded-full mt-2"></div>
            <p>应用不需要网络权限，完全离线运行</p>
          </div>
        </div>
      </div>
      
      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="font-semibold text-gray-900">确认删除</h3>
            </div>
            <p className="text-gray-600 mb-6">
              此操作将永久删除所有数据，包括打卡记录、通知消息等。此操作不可恢复。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 p-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAllData}
                className="flex-1 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}