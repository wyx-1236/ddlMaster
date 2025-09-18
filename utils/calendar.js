// utils/calendar.js
class Calendar {
  constructor() {
    this.weekdays = ['日', '一', '二', '三', '四', '五', '六']
  }

  // 获取指定年月的日历数据
  getMonthDays(year, month, selectedDate = null) {
    // 确保参数是有效的数字
    if (typeof year !== 'number' || typeof month !== 'number') {
      console.error('Invalid year or month:', year, month)
      return []
    }

    // 确保month在有效范围内
    if (month < 0 || month > 11) {
      console.error('Month out of range:', month)
      return []
    }

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // 获取上个月的最后几天来填充第一行
    const firstDayWeekday = firstDay.getDay()
    const prevMonthDays = []
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      prevMonthDays.push({
        date: date,
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: this.isToday(date),
        isSelected: selectedDate ? this.isSameDate(date, selectedDate) : false,
        hasTasks: false, // 这个会在外部设置
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    
    // 获取当月的天数
    const currentMonthDays = []
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      currentMonthDays.push({
        date: date,
        day: i,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        isSelected: selectedDate ? this.isSameDate(date, selectedDate) : false,
        hasTasks: false, // 这个会在外部设置
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    
    // 获取下个月的前几天来填充最后一行
    const lastDayWeekday = lastDay.getDay()
    const nextMonthDays = []
    const remainingDays = 6 - lastDayWeekday
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      nextMonthDays.push({
        date: date,
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: this.isToday(date),
        isSelected: selectedDate ? this.isSameDate(date, selectedDate) : false,
        hasTasks: false, // 这个会在外部设置
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
  }

  // 判断是否是今天
  isToday(date) {
    if (!this.isValidDate(date)) return false
    const today = new Date()
    return this.isSameDate(date, today)
  }

  // 判断是否是同一天
  isSameDate(date1, date2) {
    if (!this.isValidDate(date1) || !this.isValidDate(date2)) return false
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  // 验证日期是否有效
  isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime())
  }

  // 格式化日期为 YYYY-MM-DD 格式
  formatDate(date) {
    if (!this.isValidDate(date)) {
      console.error('Invalid date in formatDate:', date)
      return ''
    }
    
    try {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (error) {
      console.error('Error formatting date:', error, date)
      return ''
    }
  }

  // 格式化日期为中文显示
  formatDateChinese(date) {
    if (!this.isValidDate(date)) return ''
    
    try {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${year}年${month}月${day}日`
    } catch (error) {
      console.error('Error formatting Chinese date:', error, date)
      return ''
    }
  }

  // 获取相对日期描述
  getRelativeDate(date) {
    if (!this.isValidDate(date)) return ''
    
    try {
      const today = new Date()
      const diffTime = date.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return '今天'
      if (diffDays === 1) return '明天'
      if (diffDays === -1) return '昨天'
      if (diffDays > 1) return `${diffDays}天后`
      if (diffDays < -1) return `${Math.abs(diffDays)}天前`
      
      return this.formatDateChinese(date)
    } catch (error) {
      console.error('Error getting relative date:', error, date)
      return ''
    }
  }

  // 获取月份名称
  getMonthName(month) {
    if (typeof month !== 'number' || month < 0 || month > 11) {
      return ''
    }
    
    const monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ]
    return monthNames[month]
  }

  // 检查日期是否在指定范围内
  isDateInRange(date, startDate, endDate) {
    if (!this.isValidDate(date) || !this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      return false
    }
    return date >= startDate && date <= endDate
  }

  // 获取两个日期之间的天数差
  getDaysDifference(date1, date2) {
    if (!this.isValidDate(date1) || !this.isValidDate(date2)) {
      return 0
    }
    
    try {
      const timeDiff = date2.getTime() - date1.getTime()
      return Math.ceil(timeDiff / (1000 * 3600 * 24))
    } catch (error) {
      console.error('Error calculating days difference:', error)
      return 0
    }
  }
}

module.exports = Calendar
