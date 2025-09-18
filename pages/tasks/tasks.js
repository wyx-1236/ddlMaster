// pages/tasks/tasks.js
Page({
  data: {
    allTasks: [],
    uncompletedTasks: [],
    completedTasksCount: 0,
    isEditing: false
  },

  onLoad() {
    this.loadTasks()
  },

  onShow() {
    this.loadTasks()
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('任务页面下拉刷新')
    this.loadTasks()
    // 停止下拉刷新动画
    wx.stopPullDownRefresh()
  },

  // 加载任务数据
  loadTasks() {
    const tasks = wx.getStorageSync('tasks') || []
    const app = getApp()
    const priorityLevels = app.getPriorityLevels()
    
    // 为所有任务添加优先级样式信息、周期任务统计和标签信息
    tasks.forEach(task => {
      const priorityInfo = priorityLevels[task.priority]
      task.priorityBgColor = (priorityInfo && priorityInfo.bgColor) || 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)'
      task.priorityBorderColor = (priorityInfo && priorityInfo.borderColor) || '#DEE2E6'
      
      // 为周期任务添加统计信息
      if (task.type === 'cycle') {
        task.cycleStats = app.getCycleTaskStats(task)
      }
      
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
    
    // 全部任务（按截止日期排序，支持精确时间）
    const allTasks = app.sortTasksByDeadline([...tasks])
    
    // 未完成任务（按优先级排序）
    const uncompletedTasks = tasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        const priorityA = (priorityLevels[a.priority] && priorityLevels[a.priority].priority) || 5
        const priorityB = (priorityLevels[b.priority] && priorityLevels[b.priority].priority) || 5
        return priorityA - priorityB
      })
    
    // 计算已完成任务数量
    const completedTasksCount = tasks.filter(task => task.completed).length
    
    this.setData({
      allTasks: allTasks,
      uncompletedTasks: uncompletedTasks,
      completedTasksCount: completedTasksCount
    })
  },

  // 切换编辑模式
  toggleEditMode() {
    this.setData({
      isEditing: !this.data.isEditing
    })
  },

  // 编辑任务
  editTask(e) {
    const taskId = e.currentTarget.dataset.id
    if (!taskId) return
    
    wx.navigateTo({
      url: `/pages/edit-task/edit-task?id=${taskId}`
    })
  },

  // 完成任务
  completeTask(e) {
    const taskId = e.currentTarget.dataset.id
    if (!taskId) return
    
    const tasks = wx.getStorageSync('tasks') || []
    const task = tasks.find(t => t.id === taskId)
    
    if (!task) return

    const app = getApp()
    
    if (task.type === 'cycle') {
      // 周期任务：标记为整体完成（所有执行日期都完成）
      const cycleStats = app.getCycleTaskStats(task)
      if (cycleStats && !cycleStats.isFullyCompleted) {
        // 如果还有未完成的日期，提示用户
        wx.showModal({
          title: '周期任务',
          content: `该周期任务还有 ${cycleStats.totalDates - cycleStats.completedDates} 个执行日期未完成，是否标记为整体完成？`,
          success: (res) => {
            if (res.confirm) {
              task.completed = true
              wx.setStorageSync('tasks', tasks)
              
              // 如果任务关联了项目，更新项目进度
              if (task.projectId) {
                app.updateProjectProgress(task.projectId)
              }
              
              this.loadTasks()
              wx.showToast({
                title: '周期任务已标记为完成',
                icon: 'success'
              })
            }
          }
        })
      } else {
        // 切换整体完成状态
        task.completed = !task.completed
        wx.setStorageSync('tasks', tasks)
        
        // 如果任务关联了项目，更新项目进度
        if (task.projectId) {
          app.updateProjectProgress(task.projectId)
        }
        
        this.loadTasks()
        
        const status = task.completed ? '已完成' : '未完成'
        wx.showToast({
          title: `周期任务已标记为${status}`,
          icon: 'success'
        })
      }
    } else {
      // 定期任务：切换整体完成状态
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, completed: !t.completed }
        }
        return t
      })
      
      wx.setStorageSync('tasks', updatedTasks)
      
      // 如果任务关联了项目，更新项目进度
      if (task.projectId) {
        app.updateProjectProgress(task.projectId)
      }
      
      this.loadTasks()
      
      const status = updatedTasks.find(t => t.id === taskId).completed ? '已完成' : '未完成'
      wx.showToast({
        title: `任务已标记为${status}`,
        icon: 'success'
      })
    }
  },

  // 删除任务
  deleteTask(e) {
    const taskId = e.currentTarget.dataset.id
    if (!taskId) return
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          const tasks = wx.getStorageSync('tasks') || []
          const updatedTasks = tasks.filter(task => task.id !== taskId)
          
          wx.setStorageSync('tasks', updatedTasks)
          this.loadTasks()
          
          wx.showToast({
            title: '任务已删除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 跳转到全部任务页面
  goToAllTasks() {
    wx.navigateTo({
      url: '/pages/all-tasks/all-tasks'
    })
  },

  // 添加新任务
  addTask() {
    wx.navigateTo({
      url: '/pages/add-task/add-task'
    })
  }
})
