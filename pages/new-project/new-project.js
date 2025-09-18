// pages/new-project/new-project.js
Page({
  data: {
    projectName: '',
    projectDescription: '',
    projectDeadline: '',
    projectPriority: 'important_not_urgent'
  },

  onLoad() {
    // 页面加载完成
  },

  // 输入项目名称
  onProjectNameInput(e) {
    this.setData({
      projectName: e.detail.value || ''
    })
  },

  // 输入项目描述
  onProjectDescriptionInput(e) {
    this.setData({
      projectDescription: e.detail.value || ''
    })
  },

  // 选择项目截止日期
  onProjectDeadlineChange(e) {
    this.setData({
      projectDeadline: e.detail.value
    })
  },

  // 选择项目优先级
  selectPriority(e) {
    const priority = e.currentTarget.dataset.priority
    this.setData({
      projectPriority: priority
    })
  },



  // 验证表单
  validateForm() {
    if (!this.data.projectName || !this.data.projectName.trim()) {
      wx.showToast({
        title: '请输入项目名称',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 保存项目
  saveProject() {
    if (!this.validateForm()) {
      return
    }

    const app = getApp()
    const projectData = {
      name: this.data.projectName.trim(),
      description: this.data.projectDescription.trim(),
      deadline: this.data.projectDeadline || null,
      priority: this.data.projectPriority
    }

    // 创建项目
    const newProject = app.createProject(projectData)

    wx.showToast({
      title: '项目创建成功',
      icon: 'success'
    })

    // 返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  // 取消
  cancel() {
    wx.navigateBack()
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}) 
