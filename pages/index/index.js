// pages/index/index.js
const Calendar = require('../../utils/calendar.js')

Page({
  data: {
    currentDate: new Date(),
    selectedDate: new Date(),
    calendarDays: [],
    todayTasks: [],
    overdueTasks: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    selectedDay: new Date().getDate(),
    isSelectedToday: true
  },

  onLoad() {
    this.calendar = new Calendar()
    // 确保初始日期是有效的Date对象
    const now = new Date()
    this.setData({
      currentDate: now,
      selectedDate: now,
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      selectedMonth: now.getMonth() + 1,
      selectedDay: now.getDate(),
      isSelectedToday: true
    })
    this.initCalendar()
    this.loadTasks()
  },

  onShow() {
    this.loadTasks()
    // 检查提醒
    const app = getApp()
    app.checkReminders()
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('首页下拉刷新')
    this.loadTasks()
    this.generateCalendarDays()
    // 停止下拉刷新动画
    wx.stopPullDownRefresh()
  },

  // 初始化日历
  initCalendar() {
    this.generateCalendarDays()
  },

  // 生成日历数据
  generateCalendarDays() {
    const year = this.data.currentDate.getFullYear()
    const month = this.data.currentDate.getMonth()
    
    // 使用日历工具类生成日历数据
    let calendarDays = this.calendar.getMonthDays(year, month, this.data.selectedDate)
    
    // 标记有任务的日期
    calendarDays = this.markTaskDays(calendarDays)
    
    this.setData({
      calendarDays: calendarDays
    })
  },

  // 标记有任务的日期
  markTaskDays(calendarDays) {
    const tasks = wx.getStorageSync('tasks') || []
    const app = getApp()
    
    return calendarDays.map(day => {
      const dateStr = this.calendar.formatDate(day.date)
      const hasTasks = tasks.some(task => {
        if (task.type === 'cycle') {
          // 周期任务：检查是否在执行日期列表中
          const cycleDates = app.calculateCycleTaskDates(task)
          return cycleDates.includes(dateStr)
        } else {
          // 定期任务：检查截止日期
          return task.deadline === dateStr
        }
      })
      return { ...day, hasTasks }
    })
  },

  // 上个月
  prevMonth() {
    const newDate = new Date(this.data.currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    
    this.setData({
      currentDate: newDate,
      currentYear: newDate.getFullYear(),
      currentMonth: newDate.getMonth() + 1
    })
    this.generateCalendarDays()
  },

  // 下个月
  nextMonth() {
    const newDate = new Date(this.data.currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    
    this.setData({
      currentDate: newDate,
      currentYear: newDate.getFullYear(),
      currentMonth: newDate.getMonth() + 1
    })
    this.generateCalendarDays()
  },

  // 选择日期
  selectDate(e) {
    const index = e.currentTarget.dataset.index
    const day = this.data.calendarDays[index]
    
    if (day && day.isCurrentMonth) {
      const selectedDate = day.date
      const today = new Date()
      const isToday = this.calendar.isSameDate(selectedDate, today)
      
      this.setData({
        selectedDate: selectedDate,
        selectedYear: selectedDate.getFullYear(),
        selectedMonth: selectedDate.getMonth() + 1,
        selectedDay: selectedDate.getDate(),
        isSelectedToday: isToday
      })
      this.generateCalendarDays()
      this.loadTasks()
    }
  },

  // 获取任务标题
  getTaskTitle() {
    if (this.data.isSelectedToday) {
      return '今日任务'
    } else {
      return `${this.data.selectedMonth}月${this.data.selectedDay}日的任务`
    }
  },

  // 加载任务
  loadTasks() {
    // 确保selectedDate是有效的Date对象
    if (!this.data.selectedDate || !(this.data.selectedDate instanceof Date)) {
      console.error('selectedDate is not a valid Date object:', this.data.selectedDate)
      const now = new Date()
      this.setData({
        selectedDate: now,
        selectedYear: now.getFullYear(),
        selectedMonth: now.getMonth() + 1,
        selectedDay: now.getDate(),
        isSelectedToday: true
      })
      return
    }

    const tasks = wx.getStorageSync('tasks') || []
    const selectedDateStr = this.calendar.formatDate(this.data.selectedDate)
    const todayStr = this.calendar.formatDate(new Date())
    
    // 使用新的方法获取指定日期的任务（包括周期任务）
    const app = getApp()
    const todayTasks = app.getTasksForDate(this.data.selectedDate, tasks)
    const priorityLevels = app.getPriorityLevels()
    
    // 为任务添加优先级样式信息和标签信息
    todayTasks.forEach(task => {
      const priorityInfo = priorityLevels[task.priority]
      task.priorityBgColor = (priorityInfo && priorityInfo.bgColor) || 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)'
      task.priorityBorderColor = (priorityInfo && priorityInfo.borderColor) || '#DEE2E6'
      
      // 为任务添加标签信息
      if (task.tags && task.tags.length > 0) {
        task.tagColors = {}
        task.tagIcons = {}
        task.tagNames = {}
        task.tags.forEach(tagId => {
          const tagInfo = app.getTagInfo(tagId)
          task.tagColors[tagId] = tagInfo.color
          task.tagIcons[tagId] = tagInfo.icon
          task.tagNames[tagId] = tagInfo.name
        })
      }
    })
    
    todayTasks.sort((a, b) => {
      if (a.completed === b.completed) {
        // 未完成的任务按优先级排序
        const priorityA = (priorityLevels[a.priority] && priorityLevels[a.priority].priority) || 5
        const priorityB = (priorityLevels[b.priority] && priorityLevels[b.priority].priority) || 5
        return priorityA - priorityB
      }
      return a.completed ? 1 : -1
    })
    
    // 拖欠任务（包括定期任务和未完成的周期任务）
    const overdueTasks = []
    
    tasks.forEach(task => {
      if (task.type === 'cycle') {
        // 周期任务：为每个拖欠的执行日期创建独立的任务实例
        const cycleDates = app.calculateCycleTaskDates(task)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        cycleDates.forEach(date => {
          const dateObj = new Date(date)
          dateObj.setHours(0, 0, 0, 0)
          const isOverdue = dateObj < today
          const isCompleted = (task.completedDates && task.completedDates.includes(date)) || false
          
          if (isOverdue && !isCompleted) {
            // 为每个拖欠日期创建独立的任务实例
            const taskInstance = {
              ...task,
              id: `${task.id}_${date}`, // 使用组合ID确保唯一性
              originalId: task.id, // 保存原始任务ID
              name: task.name, // 保持原始任务名称
              type: 'periodic', // 在首页显示为定期任务
              deadline: date, // 使用执行日期作为截止日期
              deadlineTime: '23:59', // 默认截止时间
              isCycleInstance: true,
              cycleDate: date,
              completed: false, // 拖欠任务都是未完成状态
              originalCompleted: task.completed, // 保存原始完成状态
              originalType: 'cycle' // 标记原始类型
            }
            
            overdueTasks.push(taskInstance)
          }
        })
      } else {
        // 定期任务：截止日期在今天之前且未完成
        const taskDate = new Date(task.deadline)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (taskDate < today && !task.completed) {
          overdueTasks.push(task)
        }
      }
    })
    
    // 为拖欠任务添加优先级样式信息
    overdueTasks.forEach(task => {
      const priorityInfo = priorityLevels[task.priority]
      task.priorityBgColor = (priorityInfo && priorityInfo.bgColor) || 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)'
      task.priorityBorderColor = (priorityInfo && priorityInfo.borderColor) || '#DEE2E6'
    })
    
    overdueTasks.sort((a, b) => {
      const priorityA = (priorityLevels[a.priority] && priorityLevels[a.priority].priority) || 5
      const priorityB = (priorityLevels[b.priority] && priorityLevels[b.priority].priority) || 5
      return priorityA - priorityB
    })
    
    this.setData({
      todayTasks: todayTasks,
      overdueTasks: overdueTasks
    })
  },

  // 完成任务
  completeTask(e) {
    const taskId = e.currentTarget.dataset.id
    const tasks = wx.getStorageSync('tasks') || []
    
    // 检查是否是周期任务实例（组合ID格式：originalId_date）
    const isCycleInstance = taskId.includes('_') && taskId.split('_').length === 2
    
    if (isCycleInstance) {
      // 周期任务实例：提取原始任务ID和日期
      const [originalId, cycleDate] = taskId.split('_')
      const originalTask = tasks.find(t => t.id === originalId)
      
      if (originalTask && originalTask.type === 'cycle') {
        const app = getApp()
        const success = app.toggleCycleTaskCompletion(originalId, cycleDate, tasks)
        if (success) {
          wx.setStorageSync('tasks', tasks)
          
          // 如果任务关联了项目，更新项目进度
          if (originalTask.projectId) {
            app.updateProjectProgress(originalTask.projectId)
          }
          
          this.loadTasks()
          this.generateCalendarDays() // 重新生成日历以更新任务标记
          
          const isCompleted = originalTask.completedDates && originalTask.completedDates.includes(cycleDate)
          const status = isCompleted ? '已完成' : '未完成'
          wx.showToast({
            title: `任务已标记为${status}`,
            icon: 'success'
          })
        }
      }
    } else {
      // 定期任务：切换整体完成状态
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, completed: !t.completed }
        }
        return t
      })
      
      wx.setStorageSync('tasks', updatedTasks)
      
      // 如果任务关联了项目，更新项目进度
      if (task.projectId) {
        const app = getApp()
        app.updateProjectProgress(task.projectId)
      }
      
      this.loadTasks()
      this.generateCalendarDays() // 重新生成日历以更新任务标记
      
      const status = updatedTasks.find(t => t.id === taskId).completed ? '已完成' : '未完成'
      wx.showToast({
        title: `任务已标记为${status}`,
        icon: 'success'
      })
    }
  },

  // 添加新任务
  addTask() {
    wx.navigateTo({
      url: '/pages/add-task/add-task'
    })
  },

  // 跳转到提醒设置
  goToReminderSettings() {
    wx.navigateTo({
      url: '/pages/reminder-settings/reminder-settings'
    })
  }
})
