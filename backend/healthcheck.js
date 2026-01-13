import http from 'http'

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
}

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0)
  } else {
    console.error(`健康检查失败: HTTP ${res.statusCode}`)
    process.exit(1)
  }
})

req.on('error', (err) => {
  console.error('健康检查错误:', err.message)
  process.exit(1)
})

req.on('timeout', () => {
  console.error('健康检查超时')
  req.destroy()
  process.exit(1)
})

req.end()