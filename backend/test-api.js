#!/usr/bin/env node

import http from 'http'

const API_BASE = 'http://localhost:5000'

// 测试API健康检查
function testHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${API_BASE}/api/health`, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          console.log('✅ 健康检查:', result.status)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })
    
    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('请求超时'))
    })
  })
}

// 测试API文档
function testDocs() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${API_BASE}/api/docs`, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          console.log('📚 API文档可用:', Object.keys(result.endpoints).length, '个模块')
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })
    
    req.on('error', reject)
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('请求超时'))
    })
  })
}

// 运行测试
async function runTests() {
  console.log('🧪 开始API测试...\n')
  
  try {
    await testHealth()
    await testDocs()
    
    console.log('\n🎉 所有测试通过!')
    console.log('🌐 API服务器运行正常')
    console.log('📖 访问 http://localhost:5000/api/docs 查看完整API文档')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    console.log('💡 请确保API服务器正在运行 (npm run dev)')
    process.exit(1)
  }
}

runTests()