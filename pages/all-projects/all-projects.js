// pages/all-projects/all-projects.js
Page({
  data: {
    projects: [],
    filteredProjects: [],
    sortType: 'createdAt', // createdAt, deadline, progress
    filterStatus: 'all', // all, active, completed, paused
    isEditing: false
  },

  onLoad() {
    this.loadAllProjects()
  },

  onShow() {
    this.loadAllProjects()
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('全部项目页面下拉刷新')
    this.loadAllProjects()
    // 停止下拉刷新动画
    wx.stopPullDownRefresh()
  },

  // 加载所有项目
  loadAllProjects() {
    const app = getApp()
    let projects = app.getProjects()
    
    console.log('加载所有项目:', projects.length)
    console.log('项目状态分布:', {
      active: projects.filter(p => p.status === 'active').length,
      paused: projects.filter(p => p.status === 'paused').length,
      completed: projects.filter(p => p.status === 'completed').length
    })

    this.setData({
      projects: projects,
      filteredProjects: projects
    })
    
    this.applyFilters()
  },


  // 应用筛选和排序
  applyFilters() {
    let filteredProjects = [...this.data.projects]
    
    // 按状态筛选
    if (this.data.filterStatus !== 'all') {
      filteredProjects = filteredProjects.filter(project => project.status === this.data.filterStatus)
    }
    
    // 按排序类型排序
    if (this.data.sortType === 'createdAt') {
      filteredProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (this.data.sortType === 'deadline') {
      filteredProjects.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline) - new Date(b.deadline)
      })
    } else if (this.data.sortType === 'progress') {
      filteredProjects.sort((a, b) => b.progress - a.progress)
    }
    
    this.setData({
      filteredProjects: filteredProjects
    })
  },

  // 切换排序类型
  toggleSortType() {
    const sortTypes = ['createdAt', 'deadline', 'progress']
    const currentIndex = sortTypes.indexOf(this.data.sortType)
    const nextIndex = (currentIndex + 1) % sortTypes.length
    const nextSortType = sortTypes[nextIndex]
    
    this.setData({
      sortType: nextSortType
    })
    
    this.applyFilters()
    
    const sortNames = {
      'createdAt': '创建时间',
      'deadline': '截止日期',
      'progress': '完成进度'
    }
    
    wx.showToast({
      title: `按${sortNames[nextSortType]}排序`,
      icon: 'none'
    })
  },

  // 切换筛选状态
  toggleFilterStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      filterStatus: status
    })
    
    this.applyFilters()
  },

  // 切换编辑模式
  toggleEditMode() {
    this.setData({
      isEditing: !this.data.isEditing
    })
  },

  // 跳转到项目详情
  goToProjectDetail(e) {
    // 如果在编辑模式下，不执行跳转
    if (this.data.isEditing) {
      console.log('编辑模式下，不跳转到项目详情')
      return
    }
    
    const projectId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/project-detail/project-detail?id=${projectId}`
    })
  },

  // 编辑项目
  editProject(e) {
    console.log('编辑项目点击事件触发')
    const projectId = e.currentTarget.dataset.id
    console.log('编辑项目ID:', projectId)
    wx.navigateTo({
      url: `/pages/edit-project/edit-project?id=${projectId}`
    })
  },

  // 删除项目
  deleteProject(e) {
    console.log('删除项目点击事件触发')
    const projectId = e.currentTarget.dataset.id
    console.log('删除项目ID:', projectId)
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
            this.loadAllProjects()
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

  // 跳转到新建项目
  goToNewProject() {
    wx.navigateTo({
      url: '/pages/new-project/new-project'
    })
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
})
