/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidUsername = (username) => {
  return username && typeof username === 'string' && username.length >= 3 && username.length <= 32
}

/**
 * 验证密码格式
 * @param {string} password - 密码
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidPassword = (password) => {
  return password && typeof password === 'string' && password.length >= 6 && password.length <= 64
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidEmail = (email) => {
  if (!email) return true // 邮箱是可选的
  return typeof email === 'string' && /^[\w.-]+@[\w.-]+\.\w+$/.test(email)
}

/**
 * 验证手机号格式（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean} - 如果格式正确返回true，否则返回false
 */
export const isValidPhone = (phone) => {
  return phone && typeof phone === 'string' && /^1\d{10}$/.test(phone)
}
