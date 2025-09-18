// pages/projects/projects.js
Page({
  data: {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    activeProjectsList: [],
    expandedProjects: {} // 记录哪些项目是展开状态
  },

  onLoad() {
    this.loadProjectStats()
  },

  onShow() {
    this.loadProjectStats()
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('项目页面下拉刷新')
    this.loadProjectStats()
    // 停止下拉刷新动画
    wx.stopPullDownRefresh()
  },

  // 加载项目统计信息
  loadProjectStats() {
    const app = getApp()
    const stats = app.getProjectStats()
    
    // 获取进行中的项目（按创建时间排序）
    const activeProjectsList = app.getProjects({ status: 'active', sortBy: 'createdAt' })
      .map(project => {
        // 更新项目进度
        const progressInfo = app.calculateProjectProgress(project.id)
        
        
        return {
          ...project,
          totalTasks: progressInfo.totalTasks,
          completedTasks: progressInfo.completedTasks,
          progress: progressInfo.progress
        }
      })


    this.setData({
      totalProjects: stats.totalProjects,
      activeProjects: stats.activeProjects,
      completedProjects: stats.completedProjects,
      activeProjectsList: activeProjectsList
    })
  },


  // 跳转到全部项目列表
  goToAllProjects() {
    wx.navigateTo({
      url: '/pages/all-projects/all-projects'
    })
  },

  // 跳转到新增项目
  goToNewProject() {
    wx.navigateTo({
      url: '/pages/new-project/new-project'
    })
  },

  // 切换项目展开状态
  toggleProjectExpansion(e) {
    const projectId = e.currentTarget.dataset.id
    const expandedProjects = { ...this.data.expandedProjects }
    expandedProjects[projectId] = !expandedProjects[projectId]
    
    this.setData({ expandedProjects })
  },

  // 编辑项目
  editProject(e) {
    const projectId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/edit-project/edit-project?id=${projectId}`
    })
  },

  // 跳转到项目详情
  goToProjectDetail(e) {
    const projectId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/project-detail/project-detail?id=${projectId}`
    })
  },

  // 添加任务到项目
  addTaskToProject(e) {
    const projectId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/add-task/add-task?projectId=${projectId}`
    })
  },

  // 删除项目
  deleteProject(e) {
    const projectId = e.currentTarget.dataset.id
    const app = getApp()
    
    wx.showModal({
      title: '确认删除',
      content: '删除项目将同时解除所有关联任务的项目信息，是否继续？',
      success: (res) => {
        if (res.confirm) {
          const success = app.deleteProject(projectId)
          if (success) {
            wx.showToast({
              title: '项目已删除',
              icon: 'success'
            })
            this.loadProjectStats()
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
