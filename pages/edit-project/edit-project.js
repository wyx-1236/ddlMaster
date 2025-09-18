// pages/edit-project/edit-project.js
Page({
  data: {
    projectId: '',
    projectName: '',
    projectDescription: '',
    projectDeadline: '',
    projectPriority: 'not_urgent_not_important',
    priorityIndex: 3,
    today: '',
    priorityOptions: [
      { value: 'urgent_important', name: '紧急重要', color: '#DC3545' },
      { value: 'important_not_urgent', name: '重要不紧急', color: '#FFC107' },
      { value: 'urgent_not_important', name: '紧急不重要', color: '#17A2B8' },
      { value: 'not_urgent_not_important', name: '不紧急不重要', color: '#6C757D' }
    ]
  },

  onLoad(options) {
    const projectId = options.id
    if (projectId) {
      this.setData({ projectId })
      this.loadProjectDetail(projectId)
    }
    
    // 设置今天的日期
    const today = new Date().toISOString().split('T')[0]
    this.setData({ today })
  },

  // 加载项目详情
  loadProjectDetail(projectId) {
    const app = getApp()
    const projects = wx.getStorageSync('projects') || []
    const project = projects.find(p => p.id === projectId)
    
    if (project) {
      const priorityIndex = this.data.priorityOptions.findIndex(p => p.value === project.priority)
      this.setData({
        projectName: project.name,
        projectDescription: project.description || '',
        projectDeadline: project.deadline || '',
        projectPriority: project.priority || 'not_urgent_not_important',
        priorityIndex: priorityIndex >= 0 ? priorityIndex : 3
      })
    }
  },

  // 项目名称输入
  onNameInput(e) {
    this.setData({
      projectName: e.detail.value
    })
  },

  // 项目描述输入
  onDescriptionInput(e) {
    this.setData({
      projectDescription: e.detail.value
    })
  },

  // 截止日期选择
  onDeadlineChange(e) {
    this.setData({
      projectDeadline: e.detail.value
    })
  },

  // 优先级选择
  onPriorityChange(e) {
    const index = parseInt(e.detail.value)
    const priority = this.data.priorityOptions[index].value
    this.setData({
      projectPriority: priority
    })
  },

  // 保存项目
  saveProject() {
    const { projectId, projectName, projectDescription, projectDeadline, projectPriority } = this.data
    
    // 验证输入
    if (!projectName.trim()) {
      wx.showToast({
        title: '请输入项目名称',
        icon: 'none'
      })
      return
    }

    const app = getApp()
    const projects = wx.getStorageSync('projects') || []
    const projectIndex = projects.findIndex(p => p.id === projectId)
    
    if (projectIndex !== -1) {
      // 更新项目信息
      projects[projectIndex].name = projectName.trim()
      projects[projectIndex].description = projectDescription.trim()
      projects[projectIndex].deadline = projectDeadline
      projects[projectIndex].priority = projectPriority
      projects[projectIndex].updatedAt = new Date().toISOString()
      
      wx.setStorageSync('projects', projects)
      
      wx.showToast({
        title: '项目更新成功',
        icon: 'success'
      })
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: '项目不存在',
        icon: 'error'
      })
    }
  },

  // 删除项目
  deleteProject() {
    wx.showModal({
      title: '确认删除',
      content: '删除项目将同时解除所有关联任务的项目信息，是否继续？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          const success = app.deleteProject(this.data.projectId)
          
          if (success) {
            wx.showToast({
              title: '项目已删除',
              icon: 'success'
            })
            
            // 返回项目列表页
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
  }
})
