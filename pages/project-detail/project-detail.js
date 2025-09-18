// pages/project-detail/project-detail.js
Page({
  data: {
    project: null,
    projectTasks: [],
    completedTasks: [],
    uncompletedTasks: [],
    isEditing: false
  },

  onLoad(options) {
    const projectId = options.id
    if (projectId) {
      this.loadProjectDetail(projectId)
    }
  },

  onShow() {
    // 重新加载数据，确保显示最新状态
    if (this.data.project) {
      this.loadProjectDetail(this.data.project.id)
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('项目详情页面下拉刷新')
    if (this.data.project) {
      this.loadProjectDetail(this.data.project.id)
    }
    // 停止下拉刷新动画
    wx.stopPullDownRefresh()
  },

  // 加载项目详情
  loadProjectDetail(projectId) {
    const app = getApp()
    const project = app.getProjectById(projectId)
    
    if (!project) {
      wx.showToast({
        title: '项目不存在',
        icon: 'error'
      })
      wx.navigateBack()
      return
    }

    // 获取项目关联的任务
    const tasks = wx.getStorageSync('tasks') || []
    const projectTasks = tasks.filter(task => task.projectId === projectId)
    
    // 为任务添加标签信息
    projectTasks.forEach(task => {
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

    // 按状态分类任务
    const completedTasks = projectTasks.filter(task => task.completed)
    const uncompletedTasks = projectTasks.filter(task => !task.completed)

    // 按优先级排序未完成任务
    const priorityLevels = app.getPriorityLevels()
    uncompletedTasks.sort((a, b) => {
      const priorityA = (priorityLevels[a.priority] && priorityLevels[a.priority].priority) || 5
      const priorityB = (priorityLevels[b.priority] && priorityLevels[b.priority].priority) || 5
      return priorityA - priorityB
    })

    // 更新项目进度
    const updatedProject = app.updateProjectProgress(projectId)
    
    // 格式化创建时间，只显示年月日
    const projectToDisplay = updatedProject || project
    if (projectToDisplay.createdAt) {
      const createdDate = new Date(projectToDisplay.createdAt)
      projectToDisplay.formattedCreatedAt = createdDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    this.setData({
      project: projectToDisplay,
      projectTasks: projectTasks,
      completedTasks: completedTasks,
      uncompletedTasks: uncompletedTasks
    })
  },

  // 切换编辑模式
  toggleEditMode() {
    this.setData({
      isEditing: !this.data.isEditing
    })
  },

  // 完成任务
  completeTask(e) {
    const taskId = e.currentTarget.dataset.id
    if (!taskId) return

    const app = getApp()
    const tasks = wx.getStorageSync('tasks') || []
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    
    if (taskIndex !== -1) {
      const task = tasks[taskIndex]
      
      if (task.type === 'cycle') {
        // 周期任务需要特殊处理
        const today = new Date().toISOString().split('T')[0]
        app.toggleCycleTaskCompletion(taskId, today, tasks)
      } else {
        // 定期任务直接切换完成状态
        tasks[taskIndex].completed = !tasks[taskIndex].completed
        wx.setStorageSync('tasks', tasks)
      }
      
      // 更新项目进度
      app.updateProjectProgress(this.data.project.id)
      
      // 重新加载数据
      this.loadProjectDetail(this.data.project.id)
      
      wx.showToast({
        title: tasks[taskIndex].completed ? '任务已完成' : '任务已重置',
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
      content: '删除后无法恢复，确定要删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          const tasks = wx.getStorageSync('tasks') || []
          const updatedTasks = tasks.filter(task => task.id !== taskId)
          wx.setStorageSync('tasks', updatedTasks)
          
          // 更新项目进度
          const app = getApp()
          app.updateProjectProgress(this.data.project.id)
          
          // 重新加载数据
          this.loadProjectDetail(this.data.project.id)
          
          wx.showToast({
            title: '任务已删除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 添加任务到项目
  addTaskToProject() {
    wx.navigateTo({
      url: `/pages/add-task/add-task?projectId=${this.data.project.id}`
    })
  },

  // 编辑项目
  editProject() {
    wx.navigateTo({
      url: `/pages/edit-project/edit-project?id=${this.data.project.id}`
    })
  },

  // 删除项目
  deleteProject() {
    wx.showModal({
      title: '确认删除',
      content: '删除项目将同时解除所有关联任务的项目信息，是否继续？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          const success = app.deleteProject(this.data.project.id)
          if (success) {
            wx.showToast({
              title: '项目已删除',
              icon: 'success'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
})
