import React, { useState } from 'react'
import { Settings as SettingsIcon, Bell, Moon, Sun, User, Phone, Mail, Plus, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const { state, dispatch } = useApp()
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' })
  
  const handleToggleSetting = (key) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { [key]: !state.settings[key] }
    })
  }
  
  const handleAddContact = () => {
    if (!newContact.name.trim() || (!newContact.phone.trim() && !newContact.email.trim())) {
      return
    }
    
    const contact = {
      id: Date.now().toString(),
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      email: newContact.email.trim(),
      addedDate: new Date().toISOString()
    }
    
    const updatedContacts = [...state.settings.emergencyContacts, contact]
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { emergencyContacts: updatedContacts }
    })
    
    setNewContact({ name: '', phone: '', email: '' })
    setShowAddContact(false)
  }
  
  const handleRemoveContact = (contactId) => {
    const updatedContacts = state.settings.emergencyContacts.filter(c => c.id !== contactId)
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { emergencyContacts: updatedContacts }
    })
  }
  
  const settingItems = [
    {
      icon: Bell,
      title: '通知提醒',
      description: '接收应用通知和提醒',
      key: 'notificationEnabled',
      type: 'toggle'
    },
    {
      icon: SettingsIcon,
      title: '打卡提醒',
      description: '每日定时提醒打卡',
      key: 'checkInReminder',
      type: 'toggle'
    }
  ]
  
  return (
    <div className="p-4 space-y-6">
      {/* 用户信息 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-green to-brand-green-light rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{state.user.name}</h3>
            <p className="text-sm text-gray-600">
              加入时间：{new Date(state.user.joinDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* 应用设置 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <h4 className="font-semibold text-gray-900 mb-4">应用设置</h4>
        <div className="space-y-4">
          {settingItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
              </div>
              <button
                onClick={() => handleToggleSetting(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  state.settings[item.key] ? 'bg-brand-green' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    state.settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* 紧急联系人 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">紧急联系人</h4>
          <button
            onClick={() => setShowAddContact(true)}
            className="p-2 bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {state.settings.emergencyContacts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Phone className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无紧急联系人</p>
            <p className="text-sm">点击右上角添加联系人</p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.settings.emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{contact.name}</div>
                    <div className="text-sm text-gray-600">
                      {contact.phone && <div>{contact.phone}</div>}
                      {contact.email && <div>{contact.email}</div>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveContact(contact.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 主题设置 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <h4 className="font-semibold text-gray-900 mb-4">主题设置</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {state.settings.theme === 'light' ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-blue-500" />
            )}
            <div>
              <div className="font-medium text-gray-900">
                {state.settings.theme === 'light' ? '浅色模式' : '深色模式'}
              </div>
              <div className="text-sm text-gray-600">切换应用主题外观</div>
            </div>
          </div>
          <button
            onClick={() => handleToggleSetting('theme')}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled
          >
            <span className="text-sm text-gray-500">即将推出</span>
          </button>
        </div>
      </div>
      
      {/* 关于应用 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <h4 className="font-semibold text-gray-900 mb-4">关于应用</h4>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>应用版本</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>更新时间</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      {/* 添加联系人弹窗 */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">添加紧急联系人</h3>
              <button
                onClick={() => setShowAddContact(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="输入联系人姓名"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="输入手机号码"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="输入邮箱地址"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 p-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddContact}
                  disabled={!newContact.name.trim() || (!newContact.phone.trim() && !newContact.email.trim())}
                  className="flex-1 p-3 bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}