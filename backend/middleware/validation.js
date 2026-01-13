import { body, param, query, validationResult } from 'express-validator'

// 处理验证结果
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }))
    
    return res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      errors: errorMessages
    })
  }
  
  next()
}

// 用户注册验证
export const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度必须在2-20个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个字母和一个数字'),
  
  handleValidationErrors
]

// 用户登录验证
export const validateLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('用户名或邮箱不能为空'),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
  
  handleValidationErrors
]

// 打卡验证
export const validateCheckIn = [
  body('mood')
    .optional()
    .isIn(['很好', '开心', '一般', '不好', '正常'])
    .withMessage('心情状态无效'),
  
  body('note')
    .optional()
    .isLength({ max: 200 })
    .withMessage('备注最多200个字符'),
  
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('坐标格式错误'),
  
  body('location.coordinates.*')
    .optional()
    .isFloat()
    .withMessage('坐标必须是数字'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  
  body('tags.*')
    .optional()
    .isLength({ max: 20 })
    .withMessage('标签最多20个字符'),
  
  handleValidationErrors
]

// 通知验证
export const validateNotification = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('通知标题不能为空')
    .isLength({ max: 100 })
    .withMessage('标题最多100个字符'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('通知内容不能为空')
    .isLength({ max: 500 })
    .withMessage('内容最多500个字符'),
  
  body('type')
    .optional()
    .isIn(['info', 'warning', 'emergency', 'success'])
    .withMessage('通知类型无效'),
  
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('优先级必须是1-5之间的整数'),
  
  body('scheduledFor')
    .optional()
    .isISO8601()
    .withMessage('计划时间格式错误'),
  
  handleValidationErrors
]

// 用户资料更新验证
export const validateProfileUpdate = [
  body('profile.nickname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('昵称长度必须在1-20个字符之间'),
  
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('个人简介最多200个字符'),
  
  body('profile.birthday')
    .optional()
    .isISO8601()
    .withMessage('生日格式错误'),
  
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('性别选项无效'),
  
  handleValidationErrors
]

// 设置更新验证
export const validateSettingsUpdate = [
  body('notificationEnabled')
    .optional()
    .isBoolean()
    .withMessage('通知开关必须是布尔值'),
  
  body('checkInReminder')
    .optional()
    .isBoolean()
    .withMessage('打卡提醒必须是布尔值'),
  
  body('reminderTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('提醒时间格式错误（HH:MM）'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('主题选项无效'),
  
  handleValidationErrors
]

// 紧急联系人验证
export const validateEmergencyContact = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('联系人姓名不能为空')
    .isLength({ max: 50 })
    .withMessage('姓名最多50个字符'),
  
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('手机号格式错误'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('邮箱格式错误'),
  
  body('relationship')
    .optional()
    .isLength({ max: 20 })
    .withMessage('关系最多20个字符'),
  
  // 至少提供手机号或邮箱之一
  body().custom((value) => {
    if (!value.phone && !value.email) {
      throw new Error('必须提供手机号或邮箱')
    }
    return true
  }),
  
  handleValidationErrors
]

// ID参数验证
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('ID格式错误'),
  
  handleValidationErrors
]

// 分页参数验证
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt'])
    .withMessage('排序字段无效'),
  
  handleValidationErrors
]