// pages/all-tasks/all-tasks.js
Page({
  data: {
    allTasks: [],
    isEditing: false,
    sortType: 'deadline', // 'deadline' 或 'priority'
    totalTasks: 0,
    uncompletedTasks: 0,
    completedTasks: 0,
    completionRate: 0
  },

  onLoad() {
    this.loadAllTasks()
  },

  onShow() {
    this.loadAllTasks()
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('全部任务页面下拉刷新')
    this.loadAllTasks()
    // 停止下拉刷新动画
    wx.stopPullDownRefresh()
  },

  // 加载所有任务
  loadAllTasks() {
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
    
    // 根据当前排序类型排序任务
    let allTasks
    if (this.data.sortType === 'priority') {
      allTasks = app.sortTasksByPriority([...tasks])
    } else {
      allTasks = app.sortTasksByDeadline([...tasks])
    }
    
    // 计算统计数据
    const totalTasks = tasks.length
    const uncompletedTasks = tasks.filter(task => !task.completed).length
    const completedTasks = tasks.filter(task => task.completed).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    this.setData({
      allTasks: allTasks,
      totalTasks: totalTasks,
      uncompletedTasks: uncompletedTasks,
      completedTasks: completedTasks,
      completionRate: completionRate
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

  // 切换排序方式
  toggleSortType() {
    const newSortType = this.data.sortType === 'deadline' ? 'priority' : 'deadline'
    
    // 重新加载数据并应用新的排序方式
    this.setData({
      sortType: newSortType
    })
    
    // 重新加载任务数据
    this.loadAllTasks()
  },

  // 完成任务
  completeTask(e) {
    const taskId = e.currentTarget.dataset.id
    if (!taskId) return
    
    const tasks = wx.getStorageSync('tasks') || []
    const taskIndex = tasks.findIndex(task => task.id === taskId)
    
    if (taskIndex !== -1) {
      const task = tasks[taskIndex]
      tasks[taskIndex].completed = !tasks[taskIndex].completed
      wx.setStorageSync('tasks', tasks)
      
      // 如果任务关联了项目，更新项目进度
      if (task.projectId) {
        const app = getApp()
        app.updateProjectProgress(task.projectId)
      }
      
      this.loadAllTasks()
      
      wx.showToast({
        title: tasks[taskIndex].completed ? '任务已完成' : '任务已取消完成',
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
      content: '确定要删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          const tasks = wx.getStorageSync('tasks') || []
          const filteredTasks = tasks.filter(task => task.id !== taskId)
          wx.setStorageSync('tasks', filteredTasks)
          this.loadAllTasks()
          
          wx.showToast({
            title: '任务已删除',
            icon: 'success'
          })
        }
      }
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

  // 返回任务页面
  goBack() {
    wx.navigateBack()
  },

  // 添加任务
  addTask() {
    wx.navigateTo({
      url: '/pages/add-task/add-task'
    })
  }
})
