// app.js
App({
  onLaunch() {
    console.log('小程序启动')
    this.initStorage()
    this.startReminderCheck()
  },

  onShow() {
    console.log('小程序显示')
    this.startReminderCheck()
  },

  onHide() {
    console.log('小程序隐藏')
    this.stopReminderCheck()
  },

  onError(msg) {
    console.log('小程序错误:', msg)
  },

  // 初始化存储数据
  initStorage() {
    // 确保任务存储存在，但不添加示例数据
    const tasks = wx.getStorageSync('tasks') || []
    if (tasks.length === 0) {
      wx.setStorageSync('tasks', [])
      console.log('已初始化空任务数据')
    }

    const projects = wx.getStorageSync('projects') || []
    if (projects.length === 0) {
      console.log('项目数据为空，等待用户创建')
    }
  },

  // 获取今天的日期字符串
  getTodayString() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 获取明天的日期字符串
  getTomorrowString() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 格式化日期
  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 任务优先级配置 - 背景色系统
  getPriorityLevels() {
    return {
      'urgent_important': {
        name: '紧急重要',
        color: '#FF6B6B',
        bgColor: 'linear-gradient(135deg, #FFF5F5 0%, #FFE8E8 100%)',
        borderColor: '#FF6B6B',
        priority: 1,
        description: '需要立即处理的重要任务'
      },
      'important_not_urgent': {
        name: '重要不紧急',
        color: '#FFB347',
        bgColor: 'linear-gradient(135deg, #FFF8F0 0%, #FFE8D1 100%)',
        borderColor: '#FFB347',
        priority: 2,
        description: '重要但可以安排时间处理'
      },
      'urgent_not_important': {
        name: '紧急不重要',
        color: '#FFD93D',
        bgColor: 'linear-gradient(135deg, #FFFDF0 0%, #FFF8D1 100%)',
        borderColor: '#FFD93D',
        priority: 3,
        description: '时间紧迫但重要性较低'
      },
      'not_urgent_not_important': {
        name: '不紧急不重要',
        color: '#6BCF7F',
        bgColor: 'linear-gradient(135deg, #F0FFF4 0%, #E8F8E8 100%)',
        borderColor: '#6BCF7F',
        priority: 4,
        description: '可以稍后处理的一般任务'
      }
    }
  },

  // 根据优先级排序任务
  sortTasksByPriority(tasks) {
    const priorityLevels = this.getPriorityLevels()
    return tasks.sort((a, b) => {
      const priorityA = (priorityLevels[a.priority] && priorityLevels[a.priority].priority) || 5
      const priorityB = (priorityLevels[b.priority] && priorityLevels[b.priority].priority) || 5
      return priorityA - priorityB
    })
  },

  // 计算周期任务的所有执行日期
  calculateCycleTaskDates(task) {
    if (task.type !== 'cycle' || !task.startDate || !task.endDate || !task.cycleValue) {
      return []
    }

    const dates = []
    const startDate = new Date(task.startDate)
    const endDate = new Date(task.endDate)
    const cycleValue = task.cycleValue
    const cycleType = task.cycleType || 'days'

    let currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      dates.push(this.formatDate(currentDate))
      
      // 根据周期类型增加天数
      if (cycleType === 'days') {
        currentDate.setDate(currentDate.getDate() + cycleValue)
      } else if (cycleType === 'weeks') {
        currentDate.setDate(currentDate.getDate() + (cycleValue * 7))
      }
    }

    return dates
  },

  // 格式化日期为 YYYY-MM-DD 格式
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 获取指定日期的所有任务（包括周期任务）
  getTasksForDate(date, tasks) {
    const targetDate = this.formatDate(new Date(date))
    const result = []

    tasks.forEach(task => {
      if (task.type === 'cycle') {
        // 周期任务：检查是否在执行日期列表中
        const cycleDates = this.calculateCycleTaskDates(task)
        if (cycleDates.includes(targetDate)) {
          // 检查该日期是否已完成
          const isCompletedOnDate = (task.completedDates && task.completedDates.includes(targetDate)) || false
          
          // 为每个执行日期创建独立的任务实例
          const taskInstance = {
            ...task,
            id: `${task.id}_${targetDate}`, // 使用组合ID确保唯一性
            originalId: task.id, // 保存原始任务ID
            name: task.name, // 保持原始任务名称
            type: 'periodic', // 在首页显示为定期任务
            deadline: targetDate, // 使用执行日期作为截止日期
            deadlineTime: '23:59', // 默认截止时间
            isCycleInstance: true,
            cycleDate: targetDate,
            completed: isCompletedOnDate, // 使用该日期的完成状态
            originalCompleted: task.completed, // 保存原始完成状态
            originalType: 'cycle' // 标记原始类型
          }
          
          result.push(taskInstance)
        }
      } else {
        // 定期任务：检查截止日期
        if (task.deadline === targetDate) {
          result.push(task)
        }
      }
    })

    return result
  },

  // 切换周期任务在指定日期的完成状态
  toggleCycleTaskCompletion(taskId, date, tasks) {
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.type !== 'cycle') {
      return false
    }

    const targetDate = this.formatDate(new Date(date))
    
    // 确保completedDates数组存在
    if (!task.completedDates) {
      task.completedDates = []
    }

    const dateIndex = task.completedDates.indexOf(targetDate)
    
    if (dateIndex > -1) {
      // 如果已完成，则取消完成
      task.completedDates.splice(dateIndex, 1)
    } else {
      // 如果未完成，则标记为完成
      task.completedDates.push(targetDate)
    }

    // 计算整体完成状态
    const allCycleDates = this.calculateCycleTaskDates(task)
    const completedCount = task.completedDates.length
    const totalCount = allCycleDates.length
    
    // 如果所有执行日期都已完成，则标记整个任务为完成
    task.completed = completedCount === totalCount && totalCount > 0

    return true
  },

  // 获取周期任务的完成统计
  getCycleTaskStats(task) {
    if (task.type !== 'cycle') {
      return null
    }

    const allCycleDates = this.calculateCycleTaskDates(task)
    const completedDates = task.completedDates || []
    
    return {
      totalDates: allCycleDates.length,
      completedDates: completedDates.length,
      completionRate: allCycleDates.length > 0 ? Math.round((completedDates.length / allCycleDates.length) * 100) : 0,
      isFullyCompleted: completedDates.length === allCycleDates.length && allCycleDates.length > 0
    }
  },

  // 根据截止日期排序任务
  sortTasksByDeadline(tasks) {
    return tasks.sort((a, b) => {
      if (a.type === 'cycle' && b.type === 'cycle') {
        // 两个都是周期任务，按结束日期排序
        return new Date(a.endDate) - new Date(b.endDate)
      } else if (a.type === 'cycle') {
        // a是周期任务，b是定期任务
        return new Date(a.endDate) - new Date(`${b.deadline} ${b.deadlineTime || '23:59'}`)
      } else if (b.type === 'cycle') {
        // a是定期任务，b是周期任务
        return new Date(`${a.deadline} ${a.deadlineTime || '23:59'}`) - new Date(b.endDate)
      } else {
        // 两个都是定期任务，按截止时间排序
        const dateTimeA = new Date(`${a.deadline} ${a.deadlineTime || '23:59'}`)
        const dateTimeB = new Date(`${b.deadline} ${b.deadlineTime || '23:59'}`)
        return dateTimeA - dateTimeB
      }
    })
  },

  // 计算提醒时间
  calculateReminderTime(task, reminderSetting) {
    if (task.type === 'periodic') {
      // 定期任务：基于截止时间计算
      const deadlineDateTime = new Date(`${task.deadline} ${task.deadlineTime}`)
      const reminderTime = new Date(deadlineDateTime)
      reminderTime.setDate(reminderTime.getDate() - reminderSetting.days)
      reminderTime.setHours(reminderTime.getHours() - reminderSetting.hours)
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderSetting.minutes)
      return reminderTime
    } else if (task.type === 'cycle') {
      // 周期任务：基于执行日期计算
      const cycleDates = this.calculateCycleTaskDates(task)
      const today = new Date()
      const futureDates = cycleDates.filter(date => new Date(date) > today)
      
      if (futureDates.length > 0) {
        const nextExecutionDate = new Date(futureDates[0])
        const reminderTime = new Date(nextExecutionDate)
        reminderTime.setDate(reminderTime.getDate() - reminderSetting.days)
        reminderTime.setHours(reminderTime.getHours() - reminderSetting.hours)
        reminderTime.setMinutes(reminderTime.getMinutes() - reminderSetting.minutes)
        return reminderTime
      }
    }
    return null
  },

  // 获取需要提醒的任务
  getTasksNeedingReminder() {
    const tasks = wx.getStorageSync('tasks') || []
    const now = new Date()
    const reminderTasks = []

    tasks.forEach(task => {
      if (task.enableReminder && task.reminderSettings && task.reminderSettings.length > 0) {
        task.reminderSettings.forEach((setting, index) => {
          const reminderTime = this.calculateReminderTime(task, setting)
          if (reminderTime && reminderTime <= now && !task.completed) {
            reminderTasks.push({
              task: task,
              reminderSetting: setting,
              reminderTime: reminderTime,
              settingIndex: index
            })
          }
        })
      }
    })

    return reminderTasks
  },

  // 发送提醒通知
  sendReminderNotification(task, reminderSetting) {
    const reminderTime = this.calculateReminderTime(task, reminderSetting)
    if (!reminderTime) return false

    // 显示应用内提醒
    this.showInAppReminder(task, reminderSetting)
    
    // 尝试发送订阅消息
    this.sendSubscribeMessage(task, reminderSetting)

    // 存储提醒记录
    const reminders = wx.getStorageSync('reminderHistory') || []
    reminders.push({
      id: Date.now().toString(),
      taskId: task.id,
      taskName: task.name,
      reminderTime: reminderTime.toISOString(),
      sentTime: new Date().toISOString(),
      status: 'sent'
    })
    wx.setStorageSync('reminderHistory', reminders)

    return true
  },

  // 显示应用内提醒
  showInAppReminder(task, reminderSetting) {
    const priorityInfo = this.getPriorityLevels()[task.priority]
    const priorityName = priorityInfo ? priorityInfo.name : '普通'
    
    wx.showModal({
      title: '🔔 任务提醒',
      content: `任务：${task.name}\n优先级：${priorityName}\n截止时间：${task.type === 'periodic' ? `${task.deadline} ${task.deadlineTime}` : '周期任务'}`,
      showCancel: true,
      cancelText: '稍后提醒',
      confirmText: '立即处理',
      success: (res) => {
        if (res.confirm) {
          // 用户选择立即处理，可以跳转到任务详情或标记完成
          wx.showToast({
            title: '请及时处理任务',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },

  // 发送订阅消息
  sendSubscribeMessage(task, reminderSetting) {
    // 检查是否已订阅
    const subscribed = wx.getStorageSync('reminderSubscribed') || false
    if (!subscribed) {
      // 请求用户订阅
      wx.requestSubscribeMessage({
        tmplIds: ['0GIbahOKXXqJ7Sxpdbw_r5mNiLT-YTiIR4UJaS2aIVs'], // 您的订阅消息模板ID
        success: (res) => {
          if (res['0GIbahOKXXqJ7Sxpdbw_r5mNiLT-YTiIR4UJaS2aIVs'] === 'accept') {
            wx.setStorageSync('reminderSubscribed', true)
            wx.showToast({
              title: '订阅成功',
              icon: 'success'
            })
            // 订阅成功后立即发送提醒
            this.sendWechatNotification(task, reminderSetting)
          }
        },
        fail: (err) => {
          console.log('订阅失败:', err)
          // 即使订阅失败，也显示应用内提醒
          this.showInAppReminder(task, reminderSetting)
        }
      })
    } else {
      // 已订阅，直接发送通知
      this.sendWechatNotification(task, reminderSetting)
    }
  },

  // 发送微信通知
  sendWechatNotification(task, reminderSetting) {
    // 获取用户openid并发送提醒
    this.getUserOpenId().then(openid => {
      if (openid) {
        // 调用后端API发送订阅消息
        wx.request({
          url: 'https://your-backend-domain.com/api/send-reminder', // 请替换为您的实际后端地址
          method: 'POST',
          data: {
            openid: openid,
            taskId: task.id,
            taskName: task.name,
            deadline: task.deadline,
            deadlineTime: task.deadlineTime,
            priority: task.priority,
            type: task.type,
            details: task.details
          },
          success: (res) => {
            console.log('提醒发送结果:', res.data)
            if (res.data.success) {
              console.log('微信推送提醒发送成功')
            } else {
              // 降级到应用内提醒
              this.showInAppReminder(task, reminderSetting)
            }
          },
          fail: (err) => {
            console.log('提醒发送失败:', err)
            // 降级到应用内提醒
            this.showInAppReminder(task, reminderSetting)
          }
        })
      } else {
        // 无法获取openid，降级到应用内提醒
        this.showInAppReminder(task, reminderSetting)
      }
    }).catch(err => {
      console.log('获取openid失败:', err)
      // 降级到应用内提醒
      this.showInAppReminder(task, reminderSetting)
    })
  },

  // 获取用户openid
  getUserOpenId() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 调用后端API获取openid
            wx.request({
              url: 'https://your-backend-domain.com/api/get-openid', // 请替换为您的实际后端地址
              method: 'POST',
              data: { code: res.code },
              success: (res) => {
                if (res.data.success) {
                  resolve(res.data.openid)
                } else {
                  console.error('获取openid失败:', res.data)
                  reject(new Error('获取openid失败: ' + (res.data.message || '未知错误')))
                }
              },
              fail: (err) => {
                console.error('请求openid失败:', err)
                reject(new Error('网络请求失败'))
              }
            })
          } else {
            reject(new Error('登录失败'))
          }
        },
        fail: (err) => {
          console.error('微信登录失败:', err)
          reject(new Error('微信登录失败'))
        }
      })
    })
  },

  // 启动提醒检查
  startReminderCheck() {
    // 清除之前的定时器
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer)
    }
    
    // 获取用户设置的检查间隔
    const checkInterval = wx.getStorageSync('reminderCheckInterval') || 1
    const intervalMs = checkInterval * 60 * 1000 // 转换为毫秒
    
    // 立即检查一次
    this.checkReminders()
    
    // 根据用户设置的时间间隔检查
    this.reminderTimer = setInterval(() => {
      this.checkReminders()
    }, intervalMs)
    
    console.log(`提醒检查已启动，间隔：${checkInterval}分钟`)
  },

  // 停止提醒检查
  stopReminderCheck() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer)
      this.reminderTimer = null
    }
  },

  // 检查提醒
  checkReminders() {
    const reminderTasks = this.getTasksNeedingReminder()
    
    if (reminderTasks.length > 0) {
      console.log(`发现 ${reminderTasks.length} 个需要提醒的任务`)
      
      reminderTasks.forEach(({ task, reminderSetting }) => {
        // 检查是否已经提醒过
        const reminders = wx.getStorageSync('reminderHistory') || []
        const alreadyReminded = reminders.some(reminder => 
          reminder.taskId === task.id && 
          reminder.reminderTime === this.calculateReminderTime(task, reminderSetting).toISOString()
        )
        
        if (!alreadyReminded) {
          this.sendReminderNotification(task, reminderSetting)
        }
      })
    }
  },

  // 获取标签配置
  getTags() {
    return {
      'work': { name: '工作', color: '#4A90E2', icon: '💼' },
      'study': { name: '学习', color: '#28A745', icon: '📚' },
      'health': { name: '健康', color: '#FF6B6B', icon: '🏃' },
      'life': { name: '生活', color: '#FFC107', icon: '🏠' },
      'entertainment': { name: '娱乐', color: '#9C27B0', icon: '🎮' },
      'social': { name: '社交', color: '#E91E63', icon: '👥' }
    }
  },

  // 获取标签信息
  getTagInfo(tagId) {
    const tags = this.getTags()
    
    // 如果是自定义标签名称（字符串），返回自定义标签信息
    if (typeof tagId === 'string' && !tags[tagId]) {
      return {
        name: tagId,
        color: '#6C757D',
        icon: '📝'
      }
    }
    
    return tags[tagId] || tags['work']
  },


  // 根据任务名称智能推荐标签
  recommendTags(taskName) {
    const tags = this.getTags()
    const recommendations = []
    
    const keywords = {
      'work': ['项目', '报告', '会议', '工作', '开发', '设计', '文档', '客户', '业务'],
      'study': ['学习', '课程', '读书', '培训', '考试', '复习', '练习', '研究'],
      'health': ['运动', '健身', '跑步', '锻炼', '体检', '健康', '减肥', '养生'],
      'life': ['购物', '做饭', '清洁', '整理', '维修', '缴费', '生活', '家务'],
      'entertainment': ['游戏', '电影', '音乐', '旅游', '娱乐', '放松', '休闲'],
      'social': ['聚会', '约会', '朋友', '家人', '社交', '聊天', '见面']
    }
    
    Object.keys(keywords).forEach(tagId => {
      if (keywords[tagId].some(keyword => taskName.includes(keyword))) {
        recommendations.push(tagId)
      }
    })
    
    return recommendations
  },

  // ==================== 项目管理功能 ====================
  
  // 创建项目
  createProject(projectData) {
    const projects = wx.getStorageSync('projects') || []
    const newProject = {
      id: 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: projectData.name,
      description: projectData.description || '',
      deadline: projectData.deadline || null,
      priority: projectData.priority || 'important_not_urgent',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalTasks: 0,
      completedTasks: 0,
      progress: 0,
      settings: {
        autoProgress: true,
        showInHome: true,
        reminderEnabled: false
      }
    }
    
    projects.push(newProject)
    wx.setStorageSync('projects', projects)
    return newProject
  },

  // 更新项目
  updateProject(projectId, updateData) {
    const projects = wx.getStorageSync('projects') || []
    const projectIndex = projects.findIndex(p => p.id === projectId)
    
    if (projectIndex !== -1) {
      projects[projectIndex] = {
        ...projects[projectIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      }
      wx.setStorageSync('projects', projects)
      
      // 同步更新关联任务的项目信息
      this.syncProjectInfoToTasks(projectId, projects[projectIndex])
      
      return projects[projectIndex]
    }
    return null
  },

  // 删除项目
  deleteProject(projectId) {
    const projects = wx.getStorageSync('projects') || []
    const tasks = wx.getStorageSync('tasks') || []
    
    // 解除关联任务的项目信息
    const updatedTasks = tasks.map(task => {
      if (task.projectId === projectId) {
        const { projectId: _, projectName: __, isProjectTask: ___, ...rest } = task
        return rest
      }
      return task
    })
    
    // 删除项目
    const updatedProjects = projects.filter(p => p.id !== projectId)
    
    wx.setStorageSync('projects', updatedProjects)
    wx.setStorageSync('tasks', updatedTasks)
    
    return true
  },

  // 获取项目列表
  getProjects(filters = {}) {
    let projects = wx.getStorageSync('projects') || []
    
    // 应用筛选条件
    if (filters.status) {
      projects = projects.filter(p => p.status === filters.status)
    }
    if (filters.priority) {
      projects = projects.filter(p => p.priority === filters.priority)
    }
    if (filters.tags && filters.tags.length > 0) {
      projects = projects.filter(p => 
        p.tags.some(tag => filters.tags.includes(tag))
      )
    }
    
    // 应用排序
    if (filters.sortBy === 'createdAt') {
      projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (filters.sortBy === 'deadline') {
      projects.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline) - new Date(b.deadline)
      })
    } else if (filters.sortBy === 'progress') {
      projects.sort((a, b) => b.progress - a.progress)
    }
    
    return projects
  },

  // 获取项目详情
  getProjectById(projectId) {
    const projects = wx.getStorageSync('projects') || []
    return projects.find(p => p.id === projectId)
  },

  // 计算项目进度
  calculateProjectProgress(projectId) {
    const tasks = wx.getStorageSync('tasks') || []
    const projectTasks = tasks.filter(task => task.projectId === projectId)
    
    if (projectTasks.length === 0) {
      return { totalTasks: 0, completedTasks: 0, progress: 0 }
    }
    
    const completedTasks = projectTasks.filter(task => task.completed).length
    const progress = Math.round((completedTasks / projectTasks.length) * 100)
    
    return {
      totalTasks: projectTasks.length,
      completedTasks: completedTasks,
      progress: progress
    }
  },

  // 更新项目进度
  updateProjectProgress(projectId) {
    const progressInfo = this.calculateProjectProgress(projectId)
    const project = this.getProjectById(projectId)
    
    if (project) {
      const updatedProject = {
        ...project,
        totalTasks: progressInfo.totalTasks,
        completedTasks: progressInfo.completedTasks,
        progress: progressInfo.progress,
        updatedAt: new Date().toISOString()
      }
      
      // 根据项目进度更新项目状态
      if (progressInfo.progress === 100 && project.status === 'active') {
        // 项目完成，标记为已完成
        updatedProject.status = 'completed'
      } else if (progressInfo.progress < 100 && project.status === 'completed') {
        // 项目未完成但状态是已完成，改回进行中
        updatedProject.status = 'active'
      }
      
      this.updateProject(projectId, updatedProject)
      return updatedProject
    }
    
    return null
  },

  // 同步项目信息到关联任务
  syncProjectInfoToTasks(projectId, projectInfo) {
    const tasks = wx.getStorageSync('tasks') || []
    const updatedTasks = tasks.map(task => {
      if (task.projectId === projectId) {
        return {
          ...task,
          projectName: projectInfo.name
        }
      }
      return task
    })
    
    wx.setStorageSync('tasks', updatedTasks)
  },

  // 关联任务到项目
  linkTaskToProject(taskId, projectId) {
    const tasks = wx.getStorageSync('tasks') || []
    const project = this.getProjectById(projectId)
    
    if (!project) return false
    
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        projectId: projectId,
        projectName: project.name,
        isProjectTask: true
      }
      
      wx.setStorageSync('tasks', tasks)
      this.updateProjectProgress(projectId)
      return true
    }
    
    return false
  },

  // 解除任务与项目的关联
  unlinkTaskFromProject(taskId) {
    const tasks = wx.getStorageSync('tasks') || []
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    
    if (taskIndex !== -1) {
      const task = tasks[taskIndex]
      const projectId = task.projectId
      
      // 移除任务的项目信息
      const { projectId: _, projectName: __, isProjectTask: ___, ...rest } = task
      tasks[taskIndex] = rest
      
      wx.setStorageSync('tasks', tasks)
      
      // 更新项目进度
      if (projectId) {
        this.updateProjectProgress(projectId)
      }
      
      return true
    }
    
    return false
  },


  // 获取项目统计信息
  getProjectStats() {
    const projects = wx.getStorageSync('projects') || []
    
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'active').length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    
    // 按优先级统计
    const urgentImportantProjects = projects.filter(p => p.priority === 'urgent_important').length
    const importantNotUrgentProjects = projects.filter(p => p.priority === 'important_not_urgent').length
    const urgentNotImportantProjects = projects.filter(p => p.priority === 'urgent_not_important').length
    const notUrgentNotImportantProjects = projects.filter(p => p.priority === 'not_urgent_not_important').length
    
    return {
      totalProjects,
      activeProjects,
      completedProjects,
      urgentImportantProjects,
      importantNotUrgentProjects,
      urgentNotImportantProjects,
      notUrgentNotImportantProjects
    }
  },

  // 全局数据
  globalData: {
    userInfo: null,
    systemInfo: null
  }
})