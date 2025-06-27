/**
 * 检查字符串是否为空
 * @param {string} str - 要检查的字符串
 * @returns {boolean} - 如果字符串为空返回true，否则返回false
 */
export const isEmpty = (str) => {
  return !str || str.trim().length === 0
}

/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false
  return username.length >= 3 && username.length <= 32
}

/**
 * 验证密码格式
 * @param {string} password - 密码
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false
  return password.length >= 6
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidEmail = (email) => {
  if (email === '') return true // 可选字段，空字符串允许
  if (!email || typeof email !== 'string') return false
  // 支持 + 号
  return /^[\w.+-]+@[\w.-]+\.\w+$/.test(email)
}

/**
 * 验证手机号格式（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false
  return /^1\d{10}$/.test(phone)
}
