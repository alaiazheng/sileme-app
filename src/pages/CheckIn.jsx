import React, { useState, useEffect } from 'react'
import { CheckCircle, Heart, Smile, Meh, Frown, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { format, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const moods = [
  { icon: Smile, label: '很好', color: 'text-green-500', bg: 'bg-green-100' },
  { icon: Heart, label: '开心', color: 'text-pink-500', bg: 'bg-pink-100' },
  { icon: Meh, label: '一般', color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { icon: Frown, label: '不好', color: 'text-gray-500', bg: 'bg-gray-100' },
]

export default function CheckIn() {
  const { state, dispatch } = useApp()
  const [selectedMood, setSelectedMood] = useState(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [note, setNote] = useState('')
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    // 检查今天是否已经打卡
    const todayCheckIn = state.checkIns.find(checkIn => 
      isToday(new Date(checkIn.date))
    )
    setIsCheckedIn(!!todayCheckIn)
    
    return () => clearInterval(timer)
  }, [state.checkIns])
  
  const handleCheckIn = () => {
    if (isCheckedIn) return
    
    const checkInData = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood: selectedMood?.label || '正常',
      note: note.trim(),
      timestamp: Date.now()
    }
    
    dispatch({ type: 'ADD_CHECKIN', payload: checkInData })
    setIsCheckedIn(true)
    
    // 添加成功通知
    const notification = {
      id: Date.now().toString(),
      title: '打卡成功',
      message: `今日打卡完成，心情：${checkInData.mood}`,
      type: 'success',
      date: new Date().toISOString(),
      read: false
    }
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
    
    // 重置表单
    setSelectedMood(null)
    setNote('')
  }
  
  const todayCheckIn = state.checkIns.find(checkIn => 
    isToday(new Date(checkIn.date))
  )
  
  return (
    <div className="p-4 space-y-6">
      {/* 时间显示 */}
      <div className="text-center py-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {format(currentTime, 'HH:mm')}
        </div>
        <div className="text-lg text-gray-600">
          {format(currentTime, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
        </div>
      </div>
      
      {/* 打卡状态 */}
      <div className="bg-white rounded-xl p-6 card-shadow text-center">
        {isCheckedIn ? (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">今日已打卡</h3>
              <p className="text-gray-600">
                打卡时间：{format(new Date(todayCheckIn.date), 'HH:mm')}
              </p>
              {todayCheckIn.mood && (
                <p className="text-gray-600">心情：{todayCheckIn.mood}</p>
              )}
              {todayCheckIn.note && (
                <p className="text-gray-600 mt-2 text-sm bg-gray-50 rounded-lg p-2">
                  {todayCheckIn.note}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-green to-brand-green-light rounded-full flex items-center justify-center animate-pulse-slow">
              <Clock className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">今日打卡</h3>
              <p className="text-gray-600">点击下方按钮完成今日打卡</p>
            </div>
          </div>
        )}
      </div>
      
      {!isCheckedIn && (
        <>
          {/* 心情选择 */}
          <div className="bg-white rounded-xl p-4 card-shadow">
            <h4 className="font-semibold text-gray-900 mb-4">今天心情如何？</h4>
            <div className="grid grid-cols-4 gap-3">
              {moods.map((mood, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMood(mood)}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    selectedMood?.label === mood.label
                      ? `${mood.bg} ring-2 ring-brand-green`
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <mood.icon className={`w-6 h-6 mx-auto mb-1 ${
                    selectedMood?.label === mood.label ? mood.color : 'text-gray-400'
                  }`} />
                  <div className={`text-xs ${
                    selectedMood?.label === mood.label ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {mood.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 备注输入 */}
          <div className="bg-white rounded-xl p-4 card-shadow">
            <h4 className="font-semibold text-gray-900 mb-3">添加备注（可选）</h4>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录今天的特别事情..."
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
              rows="3"
              maxLength="100"
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {note.length}/100
            </div>
          </div>
          
          {/* 打卡按钮 */}
          <button
            onClick={handleCheckIn}
            className="w-full bg-gradient-to-r from-brand-green to-brand-green-light text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          >
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>完成打卡</span>
            </div>
          </button>
        </>
      )}
      
      {/* 打卡统计 */}
      <div className="bg-white rounded-xl p-4 card-shadow">
        <h4 className="font-semibold text-gray-900 mb-4">打卡统计</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-brand-green">{state.stats.totalCheckIns}</div>
            <div className="text-xs text-gray-500">总打卡数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-500">{state.stats.currentStreak}</div>
            <div className="text-xs text-gray-500">连续天数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-500">{state.stats.longestStreak}</div>
            <div className="text-xs text-gray-500">最长记录</div>
          </div>
        </div>
      </div>
    </div>
  )
}