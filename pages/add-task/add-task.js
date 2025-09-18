// pages/add-task/add-task.js
Page({
  data: {
    taskType: 'periodic', // 默认选择定期任务
    taskName: '',
    deadline: '',
    deadlineTime: '', // 定期任务的截止时间
    details: '',
    priority: 'important_not_urgent', // 默认选择重要不紧急
    cycleType: 'days', // 'days' or 'weeks'
    cycleValue: '', // 周期数值，允许为空
    startDate: '', // 周期任务起始日期
    endDate: '', // 周期任务结束日期
    // 提醒功能相关字段
    enableReminder: false, // 是否启用提醒
    reminderSettings: [], // 提醒设置列表
    // 标签相关字段
    selectedTags: [], // 选中的标签
    selectedTagNames: '', // 选中标签的名称（用于显示）
    customTagName: '', // 自定义标签名称
    showCustomTagInput: false, // 是否显示自定义标签输入框
    customTagId: null, // 自定义标签的临时ID
    // 项目相关字段
    selectedProjectId: '', // 选中的项目ID
    selectedProjectName: '', // 选中的项目名称
    projects: [], // 项目列表
    typeOptions: [
      { value: 'cycle', label: '周期任务' },
      { value: 'periodic', label: '定期任务' }
    ]
  },

  onLoad(options) {
    // 设置默认截止日期为明天
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // 初始化标签数据
    const app = getApp()
    const tags = Object.keys(app.getTags()).map(tagId => ({
      id: tagId,
      ...app.getTagInfo(tagId)
    }))
    
    // 初始化项目数据
    const projects = app.getProjects({ status: 'active' })
    
    // 检查是否从项目页面跳转过来
    let selectedProjectId = ''
    let selectedProjectName = ''
    if (options.projectId) {
      const project = app.getProjectById(options.projectId)
      if (project) {
        selectedProjectId = project.id
        selectedProjectName = project.name
      }
    }
    
    this.setData({
      deadline: this.formatDate(tomorrow),
      tags: tags,
      projects: projects,
      selectedProjectId: selectedProjectId,
      selectedProjectName: selectedProjectName
    })
  },

  // 选择任务类型
  selectTaskType(e) {
    const type = e.currentTarget.dataset.type
    if (type) {
      this.setData({
        taskType: type
      })
    }
  },

  // 输入任务名称
  inputTaskName(e) {
    this.setData({
      taskName: e.detail.value || ''
    })
  },

  // 选择截止日期
  selectDeadline(e) {
    const deadline = e.detail.value
    if (deadline) {
      this.setData({
        deadline: deadline
      })
    }
  },

  // 选择截止时间
  selectDeadlineTime(e) {
    this.setData({
      deadlineTime: e.detail.value
    })
  },

  // 输入任务详情
  inputDetails(e) {
    this.setData({
      details: e.detail.value || ''
    })
  },

  // 输入任务名称时智能推荐标签
  inputTaskName(e) {
    const taskName = e.detail.value || ''
    this.setData({
      taskName: taskName
    })
    
    // 智能推荐标签
    if (taskName.trim()) {
      const app = getApp()
      const recommendedTags = app.recommendTags(taskName)
      if (recommendedTags.length > 0 && this.data.selectedTags.length === 0) {
        const newSelectedTags = recommendedTags.slice(0, 2) // 最多推荐2个标签
        const selectedTagNames = newSelectedTags.map(tagId => {
          const tag = this.data.tags.find(t => t.id === tagId)
          return tag ? tag.name : ''
        }).filter(name => name).join('、')
        
        this.setData({
          selectedTags: newSelectedTags,
          selectedTagNames: selectedTagNames
        })
      }
    }
  },

  // 切换标签选择
  toggleTag(e) {
    const tagId = e.currentTarget.dataset.tagId
    const selectedTags = [...this.data.selectedTags]
    const index = selectedTags.indexOf(tagId)
    
    if (index > -1) {
      // 已选中，则取消选择
      selectedTags.splice(index, 1)
    } else {
      // 未选中，则添加选择
      selectedTags.push(tagId)
    }
    
    // 更新选中标签的名称显示
    const selectedTagNames = selectedTags.map(tagId => {
      const tag = this.data.tags.find(t => t.id === tagId)
      return tag ? tag.name : ''
    }).filter(name => name).join('、')
    
    this.setData({
      selectedTags: selectedTags,
      selectedTagNames: selectedTagNames
    })
  },

  // 显示自定义标签输入框
  showCustomTagInput() {
    this.setData({
      showCustomTagInput: true
    })
  },

  // 隐藏自定义标签输入框
  hideCustomTagInput() {
    this.setData({
      showCustomTagInput: false,
      customTagName: ''
    })
  },

  // 输入自定义标签名称
  onCustomTagNameInput(e) {
    this.setData({
      customTagName: e.detail.value
    })
  },

  // 添加自定义标签
  addCustomTag() {
    const customTagName = this.data.customTagName.trim()
    
    if (!customTagName) {
      wx.showToast({
        title: '请输入标签名称',
        icon: 'none'
      })
      return
    }
    
    // 检查是否已存在相同名称的标签
    const existingTag = this.data.tags.find(tag => tag.name === customTagName)
    if (existingTag) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      })
      return
    }
    
    // 创建临时自定义标签
    const customTagId = 'custom_temp_' + Date.now()
    const customTag = {
      id: customTagId,
      name: customTagName,
      color: '#6C757D',
      icon: '📝'
    }
    
    // 添加到标签列表（临时）
    const updatedTags = [...this.data.tags, customTag]
    
    // 自动选中新添加的标签
    const selectedTags = [...this.data.selectedTags, customTagId]
    const selectedTagNames = selectedTags.map(tagId => {
      const tag = updatedTags.find(t => t.id === tagId)
      return tag ? tag.name : ''
    }).filter(name => name).join('、')
    
    this.setData({
      tags: updatedTags,
      selectedTags: selectedTags,
      selectedTagNames: selectedTagNames,
      showCustomTagInput: false,
      customTagName: '',
      customTagId: customTagId
    })
    
    wx.showToast({
      title: '自定义标签添加成功',
      icon: 'success'
    })
  },

  // 选择项目
  selectProject(e) {
    const projectId = e.currentTarget.dataset.projectId
    const project = this.data.projects.find(p => p.id === projectId)
    
    if (project) {
      this.setData({
        selectedProjectId: projectId,
        selectedProjectName: project.name
      })
    }
  },

  // 清除项目选择
  clearProjectSelection() {
    this.setData({
      selectedProjectId: '',
      selectedProjectName: ''
    })
  },

  // 切换重要程度
  // 选择任务优先级
  selectPriority(e) {
    const priority = e.currentTarget.dataset.priority
    this.setData({
      priority: priority
    })
  },

  // 选择周期类型
  selectCycleType(e) {
    const cycleType = e.currentTarget.dataset.type
    this.setData({
      cycleType: cycleType
    })
  },

  // 设置周期数值
  setCycleValue(e) {
    const inputValue = e.detail.value
    if (inputValue === '') {
      // 允许清空输入框
      this.setData({
        cycleValue: ''
      })
    } else {
      const value = parseInt(inputValue)
      if (!isNaN(value) && value > 0) {
        this.setData({
          cycleValue: value
        })
      }
    }
  },

  // 选择起始日期
  selectStartDate(e) {
    this.setData({
      startDate: e.detail.value
    })
  },

  // 选择结束日期
  selectEndDate(e) {
    this.setData({
      endDate: e.detail.value
    })
  },

  // 切换提醒功能开关
  toggleReminder(e) {
    this.setData({
      enableReminder: e.detail.value
    })
  },

  // 添加提醒设置
  addReminderSetting() {
    const newSetting = {
      id: Date.now().toString(),
      days: 0,
      hours: 0,
      minutes: 0
    }
    this.setData({
      reminderSettings: [...this.data.reminderSettings, newSetting]
    })
  },

  // 删除提醒设置
  removeReminderSetting(e) {
    const id = e.currentTarget.dataset.id
    const settings = this.data.reminderSettings.filter(setting => setting.id !== id)
    this.setData({
      reminderSettings: settings
    })
  },

  // 更新提醒设置
  updateReminderSetting(e) {
    const { id, field } = e.currentTarget.dataset
    const value = e.detail.value
    
    // 确保输入值是有效的数字
    const numValue = value === '' ? 0 : parseInt(value)
    if (isNaN(numValue) || numValue < 0) {
      return
    }
    
    const settings = this.data.reminderSettings.map(setting => {
      if (setting.id === id) {
        return { ...setting, [field]: numValue }
      }
      return setting
    })
    this.setData({
      reminderSettings: settings
    })
  },

  // 格式化日期
  formatDate(date) {
    if (!date || !(date instanceof Date)) {
      return ''
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 验证表单
  validateForm() {
    if (!this.data.taskName || !this.data.taskName.trim()) {
      wx.showToast({
        title: '请输入任务名称',
        icon: 'none'
      })
      return false
    }

    if (this.data.taskType === 'cycle') {
      // 周期任务验证
      if (!this.data.cycleValue || this.data.cycleValue < 1) {
        wx.showToast({
          title: '请输入有效的周期数值',
          icon: 'none'
        })
        return false
      }
      
      if (!this.data.startDate) {
        wx.showToast({
          title: '请选择起始日期',
          icon: 'none'
        })
        return false
      }
      
      if (!this.data.endDate) {
        wx.showToast({
          title: '请选择结束日期',
          icon: 'none'
        })
        return false
      }
      
      // 验证日期范围
      if (new Date(this.data.startDate) >= new Date(this.data.endDate)) {
        wx.showToast({
          title: '结束日期必须晚于起始日期',
          icon: 'none'
        })
        return false
      }
    } else {
      // 定期任务验证
      if (!this.data.deadline) {
        wx.showToast({
          title: '请选择截止日期',
          icon: 'none'
        })
        return false
      }

      if (!this.data.deadlineTime) {
        wx.showToast({
          title: '请选择截止时间',
          icon: 'none'
        })
        return false
      }

      // 检查截止日期时间是否在今天之前
      const selectedDateTime = new Date(`${this.data.deadline} ${this.data.deadlineTime}`)
      const now = new Date()
      
      if (selectedDateTime < now) {
        wx.showToast({
          title: '截止时间不能早于当前时间',
          icon: 'none'
        })
        return false
      }
    }

    return true
  },

  // 保存任务
  saveTask() {
    if (!this.validateForm()) {
      return
    }

    const tasks = wx.getStorageSync('tasks') || []
    
    // 生成唯一ID
    const newId = Date.now().toString()
    
    // 处理标签数据，将临时自定义标签转换为可保存的格式
    const processedTags = this.data.selectedTags.map(tagId => {
      const tag = this.data.tags.find(t => t.id === tagId)
      if (tag && tag.id.startsWith('custom_temp_')) {
        // 如果是临时自定义标签，返回标签名称
        return tag.name
      }
      return tagId
    })
    
    const newTask = {
      id: newId,
      name: this.data.taskName.trim(),
      type: this.data.taskType,
      priority: this.data.priority,
      details: this.data.details.trim(),
      completed: false,
      createTime: new Date().toISOString(),
      // 根据任务类型设置不同的日期字段
      deadline: this.data.taskType === 'periodic' ? this.data.deadline : null,
      deadlineTime: this.data.taskType === 'periodic' ? this.data.deadlineTime : null,
      // 周期任务相关字段
      cycleType: this.data.taskType === 'cycle' ? this.data.cycleType : null,
      cycleValue: this.data.taskType === 'cycle' ? this.data.cycleValue : null,
      startDate: this.data.taskType === 'cycle' ? this.data.startDate : null,
      endDate: this.data.taskType === 'cycle' ? this.data.endDate : null,
      // 周期任务完成状态记录
      completedDates: this.data.taskType === 'cycle' ? [] : null,
      // 提醒功能相关字段
      enableReminder: this.data.enableReminder,
      reminderSettings: this.data.enableReminder ? this.data.reminderSettings : [],
      // 标签相关字段
      tags: processedTags,
      // 项目相关字段
      projectId: this.data.selectedProjectId || null,
      projectName: this.data.selectedProjectName || null,
      isProjectTask: !!this.data.selectedProjectId
    }
    
    tasks.push(newTask)
    wx.setStorageSync('tasks', tasks)
    
    // 如果任务关联了项目，更新项目进度
    if (this.data.selectedProjectId) {
      const app = getApp()
      app.updateProjectProgress(this.data.selectedProjectId)
    }
    
    wx.showToast({
      title: '任务添加成功',
      icon: 'success'
    })
    
    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  // 取消添加
  cancel() {
    wx.navigateBack()
  }
})
