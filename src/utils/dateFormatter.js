/**
 * 统一的时间格式化工具
 * 将时间转换为 YYYY-MM-DD hh:mm:ss 格式
 */

/**
 * 格式化日期为 YYYY-MM-DD hh:mm:ss 格式
 * @param {Date|string|number} date - 要格式化的日期
 * @returns {string} 格式化后的日期字符串
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date|string|number} date - 要格式化的日期
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}/${month}/${day}`
}

/**
 * 格式化时间为 hh:mm:ss 格式
 * @param {Date|string|number} date - 要格式化的日期
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 获取当前时间的格式化字符串
 * @returns {string} 当前时间的格式化字符串
 */
export const getCurrentDateTime = () => {
  return formatDateTime(new Date())
}

/**
 * 获取当前日期的格式化字符串
 * @returns {string} 当前日期的格式化字符串
 */
export const getCurrentDate = () => {
  return formatDate(new Date())
}

/**
 * 获取当前时间的格式化字符串
 * @returns {string} 当前时间的格式化字符串
 */
export const getCurrentTime = () => {
  return formatTime(new Date())
}

/**
 * 将ISO字符串转换为格式化日期时间
 * @param {string} isoString - ISO格式的日期字符串
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatISOString = (isoString) => {
  if (!isoString) return ''
  return formatDateTime(isoString)
}

/**
 * 将时间戳转换为格式化日期时间
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  return formatDateTime(timestamp)
}

export default {
  formatDateTime,
  formatDate,
  formatTime,
  getCurrentDateTime,
  getCurrentDate,
  getCurrentTime,
  formatISOString,
  formatTimestamp
} 