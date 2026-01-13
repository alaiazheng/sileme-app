import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Bell, Shield, Calendar, Flame, Award } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { format, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function Home() {
  const { state } = useApp()
  const { stats, checkIns } = state
  
  const todayCheckIn = checkIns.find(checkIn => 
    isToday(new Date(checkIn.date))
  )
  
  const features = [
    {
      title: '一键打卡',
      description: '简单快捷的生活状态确认',
      icon: CheckCircle,
      color: 'from-green-400 to-green-600',
      link: '/checkin',
      status: todayCheckIn ? '今日已打卡' : '点击打卡'
    },
    {
      title: '紧急通知',
      description: '重要消息及时推送提醒',
      icon: Bell,
      color: 'from-orange-400 to-orange-600',
      link: '/notifications',
      status: `${state.notifications.filter(n => !n.read).length} 条未读`
    },
    {
      title: '隐私保护',
      description: '安全可靠的数据保护机制',
      icon: Shield,
      color: 'from-blue-400 to-blue-600',
      link: '/privacy',
      status: '数据安全'
    }
  ]
  
  return (
    <div className="p-4 space-y-6">
      {/* 欢迎区域 */}
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-brand-green to-brand-green-light rounded-full flex items-center justify-center shadow-lg">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-brand-green rounded-full"></div>
            <div className="w-3 h-3 bg-brand-green rounded-full ml-1"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">死了么</h2>
        <p className="text-gray-600">简约生活提醒助手</p>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 text-center card-shadow">
          <Calendar className="w-6 h-6 text-brand-green mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalCheckIns}</div>
          <div className="text-xs text-gray-500">总打卡</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center card-shadow">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.currentStreak}</div>
          <div className="text-xs text-gray-500">连续天数</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center card-shadow">
          <Award className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.longestStreak}</div>
          <div className="text-xs text-gray-500">最长记录</div>
        </div>
      </div>
      
      {/* 功能卡片 */}
      <div className="space-y-4">
        {features.map((feature, index) => (
          <Link
            key={index}
            to={feature.link}
            className="block bg-white rounded-xl p-4 card-shadow hover:shadow-lg transition-all duration-200 active:scale-98"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-md`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-brand-green">{feature.status}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* 最近打卡记录 */}
      {checkIns.length > 0 && (
        <div className="bg-white rounded-xl p-4 card-shadow">
          <h3 className="font-semibold text-gray-900 mb-3">最近打卡</h3>
          <div className="space-y-2">
            {checkIns.slice(-3).reverse().map((checkIn, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full"></div>
                  <span className="text-sm text-gray-900">
                    {format(new Date(checkIn.date), 'MM月dd日 HH:mm', { locale: zhCN })}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{checkIn.mood || '正常'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}