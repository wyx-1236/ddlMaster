// pages/edit-task/edit-task.js
Page({
  data: {
    taskId: '',
    taskName: '',
    taskType: 'periodic',
    taskDetails: '',
    taskDeadline: '',
    taskDeadlineTime: '',
    taskPriority: 'not_urgent_not_important',
    taskProjectId: '',
    taskProjectName: '',
    selectedTags: [],
    selectedTagNames: '',
    customTagName: '',
    showCustomTagInput: false,
    customTagId: '',
    
    // 周期任务相关
    cycleType: 'days',
    cycleValue: 1,
    startDate: '',
    endDate: '',
    
    // 选项数据
    typeOptions: ['periodic', 'cycle'],
    typeNames: ['定期任务', '周期任务'],
    typeIndex: 0,
    cycleTypeOptions: ['days', 'weeks'],
    cycleTypeNames: ['天', '周'],
    cycleTypeIndex: 0,
    priorityOptions: [
      { value: 'urgent_important', name: '紧急重要', color: '#DC3545' },
      { value: 'important_not_urgent', name: '重要不紧急', color: '#FFC107' },
      { value: 'urgent_not_important', name: '紧急不重要', color: '#17A2B8' },
      { value: 'not_urgent_not_important', name: '不紧急不重要', color: '#6C757D' }
    ],
    priorityIndex: 3,
    projectIndex: -1,
    today: '',
    projects: [],
    tags: []
  },

  onLoad(options) {
    const taskId = options.id
    if (taskId) {
      this.setData({ taskId })
    }
    
    // 先加载项目列表和标签，再加载任务详情
    this.loadProjects()
    this.loadTags()
    
    // 设置今天的日期
    const today = new Date().toISOString().split('T')[0]
    this.setData({ today })
    
    // 延迟加载任务详情，确保项目列表已加载
    if (taskId) {
      setTimeout(() => {
        this.loadTaskDetail(taskId)
      }, 100)
    }
  },

  // 加载任务详情
  loadTaskDetail(taskId) {
    console.log('加载任务详情，任务ID:', taskId)
    const tasks = wx.getStorageSync('tasks') || []
    const task = tasks.find(t => t.id === taskId)
    
    console.log('找到的任务:', task)
    
    if (task) {
      const typeIndex = this.data.typeOptions.indexOf(task.type)
      const priorityIndex = this.data.priorityOptions.findIndex(p => p.value === task.priority)
      const cycleTypeIndex = this.data.cycleTypeOptions.indexOf(task.cycleType || 'days')
      
      // 安全地获取项目索引
      let projectIndex = -1
      if (this.data.projects && this.data.projects.length > 0) {
        projectIndex = this.data.projects.findIndex(p => p.id === task.projectId)
      }
      
      this.setData({
        taskName: task.name,
        taskType: task.type,
        taskDetails: task.details || '',
        taskDeadline: task.deadline || '',
        taskDeadlineTime: task.deadlineTime || '',
        taskPriority: task.priority || 'not_urgent_not_important',
        taskProjectId: task.projectId || '',
        taskProjectName: task.projectName || '',
        selectedTags: task.tags || [],
        selectedTagNames: task.tagNames || '',
        // 周期任务相关
        cycleType: task.cycleType || 'days',
        cycleValue: task.cycleValue || 1,
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        // 索引
        typeIndex: typeIndex >= 0 ? typeIndex : 0,
        priorityIndex: priorityIndex >= 0 ? priorityIndex : 3,
        cycleTypeIndex: cycleTypeIndex >= 0 ? cycleTypeIndex : 0,
        projectIndex: projectIndex >= 0 ? projectIndex : -1
      })
    }
  },

  // 加载项目列表
  loadProjects() {
    const app = getApp()
    const projects = app.getProjects({ status: 'active' })
    this.setData({ projects })
  },

  // 加载标签列表
  loadTags() {
    const app = getApp()
    const tags = app.getTags()
    const tagList = Object.keys(tags).map(id => ({
      id,
      name: tags[id].name,
      color: tags[id].color,
      icon: tags[id].icon
    }))
    this.setData({ tags: tagList })
  },

  // 任务名称输入
  onNameInput(e) {
    this.setData({
      taskName: e.detail.value
    })
  },

  // 任务类型选择
  onTypeChange(e) {
    const index = parseInt(e.detail.value)
    const taskType = this.data.typeOptions[index]
    console.log('任务类型选择:', taskType, '索引:', index)
    this.setData({
      taskType: taskType,
      typeIndex: index
    })
  },

  // 任务描述输入
  onDetailsInput(e) {
    this.setData({
      taskDetails: e.detail.value
    })
  },

  // 截止日期选择
  onDeadlineChange(e) {
    this.setData({
      taskDeadline: e.detail.value
    })
  },

  // 截止时间选择
  onDeadlineTimeChange(e) {
    this.setData({
      taskDeadlineTime: e.detail.value
    })
  },

  // 优先级选择
  onPriorityChange(e) {
    const index = parseInt(e.detail.value)
    const priority = this.data.priorityOptions[index].value
    this.setData({
      taskPriority: priority
    })
  },

  // 项目选择
  onProjectChange(e) {
    const index = parseInt(e.detail.value)
    const project = this.data.projects[index]
    if (project) {
      this.setData({
        taskProjectId: project.id,
        taskProjectName: project.name
      })
    }
  },

  // 周期类型选择
  onCycleTypeChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      cycleType: this.data.cycleTypeOptions[index]
    })
  },

  // 周期值输入
  onCycleValueInput(e) {
    this.setData({
      cycleValue: parseInt(e.detail.value) || 1
    })
  },

  // 开始日期选择
  onStartDateChange(e) {
    this.setData({
      startDate: e.detail.value
    })
  },

  // 结束日期选择
  onEndDateChange(e) {
    this.setData({
      endDate: e.detail.value
    })
  },

  // 标签选择
  toggleTag(e) {
    const tagId = e.currentTarget.dataset.tagId
    const selectedTags = [...this.data.selectedTags]
    const index = selectedTags.indexOf(tagId)
    
    if (index > -1) {
      selectedTags.splice(index, 1)
    } else {
      selectedTags.push(tagId)
    }
    
    // 更新标签名称显示
    const selectedTagNames = selectedTags.map(id => {
      const tag = this.data.tags.find(t => t.id === id)
      return tag ? tag.name : ''
    }).filter(name => name).join('、')
    
    this.setData({
      selectedTags,
      selectedTagNames
    })
  },

  // 显示自定义标签输入
  showCustomTagInput() {
    this.setData({
      showCustomTagInput: true
    })
  },

  // 隐藏自定义标签输入
  hideCustomTagInput() {
    this.setData({
      showCustomTagInput: false,
      customTagName: ''
    })
  },

  // 自定义标签名称输入
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
    
    const existingTag = this.data.tags.find(tag => tag.name === customTagName)
    if (existingTag) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      })
      return
    }
    
    const customTagId = 'custom_temp_' + Date.now()
    const customTag = {
      id: customTagId,
      name: customTagName,
      color: '#6C757D',
      icon: '📝'
    }
    
    const updatedTags = [...this.data.tags, customTag]
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

  // 保存任务
  saveTask() {
    console.log('保存任务按钮被点击')
    console.log('开始保存任务')
    const {
      taskId, taskName, taskType, taskDetails, taskDeadline, taskDeadlineTime,
      taskPriority, taskProjectId, taskProjectName, selectedTags,
      cycleType, cycleValue, startDate, endDate
    } = this.data
    
    console.log('任务数据:', {
      taskId, taskName, taskType, taskDetails, taskDeadline, taskDeadlineTime,
      taskPriority, taskProjectId, taskProjectName, selectedTags,
      cycleType, cycleValue, startDate, endDate
    })
    
    // 检查任务ID是否存在
    if (!taskId) {
      console.error('任务ID为空')
      wx.showToast({
        title: '任务ID不存在',
        icon: 'error'
      })
      return
    }
    
    // 验证输入
    if (!taskName.trim()) {
      wx.showToast({
        title: '请输入任务名称',
        icon: 'none'
      })
      return
    }
    
    console.log('任务类型:', taskType)
    console.log('任务名称:', taskName)

    if (taskType === 'periodic' && !taskDeadline) {
      wx.showToast({
        title: '请选择截止日期',
        icon: 'none'
      })
      return
    }

    if (taskType === 'cycle' && (!startDate || !endDate)) {
      wx.showToast({
        title: '请选择开始和结束日期',
        icon: 'none'
      })
      return
    }

    const tasks = wx.getStorageSync('tasks') || []
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    
    console.log('任务索引:', taskIndex)
    console.log('任务总数:', tasks.length)
    
    if (taskIndex !== -1) {
      // 处理标签数据
      const processedTags = selectedTags.map(tagId => {
        const tag = this.data.tags.find(t => t.id === tagId)
        if (tag && tag.id.startsWith('custom_temp_')) {
          return tag.name // 返回标签名称用于临时自定义标签
        }
        return tagId
      })
      
      // 更新任务信息
      const updatedTask = {
        ...tasks[taskIndex],
        name: taskName.trim(),
        type: taskType,
        details: taskDetails.trim(),
        deadline: taskDeadline,
        deadlineTime: taskDeadlineTime,
        priority: taskPriority,
        projectId: taskProjectId,
        projectName: taskProjectName,
        tags: processedTags,
        // 周期任务相关
        cycleType: taskType === 'cycle' ? cycleType : undefined,
        cycleValue: taskType === 'cycle' ? cycleValue : undefined,
        startDate: taskType === 'cycle' ? startDate : undefined,
        endDate: taskType === 'cycle' ? endDate : undefined
      }
      
      // 更新标签显示信息
      const app = getApp()
      try {
        updatedTask.tagNames = processedTags.map(tagId => {
          const tagInfo = app.getTagInfo(tagId)
          return tagInfo.name
        }).join('、')
        
        updatedTask.tagIcons = processedTags.map(tagId => {
          const tagInfo = app.getTagInfo(tagId)
          return tagInfo.icon
        }).join('')
        
        // 更新优先级背景色
        const priorityLevels = app.getPriorityLevels()
        const priorityInfo = priorityLevels[taskPriority] || priorityLevels['not_urgent_not_important']
        updatedTask.priorityBgColor = priorityInfo.bgColor
        updatedTask.priorityBorderColor = priorityInfo.borderColor
      } catch (error) {
        console.error('更新任务显示信息时出错:', error)
        // 设置默认值
        updatedTask.tagNames = ''
        updatedTask.tagIcons = ''
        updatedTask.priorityBgColor = '#f8f9fa'
        updatedTask.priorityBorderColor = '#e9ecef'
      }
      
      tasks[taskIndex] = updatedTask
      wx.setStorageSync('tasks', tasks)
      
      console.log('任务保存成功')
      
      wx.showToast({
        title: '任务更新成功',
        icon: 'success'
      })
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: '任务不存在',
        icon: 'error'
      })
    }
  },

  // 删除任务
  deleteTask() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个任务吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          const tasks = wx.getStorageSync('tasks') || []
          const filteredTasks = tasks.filter(t => t.id !== this.data.taskId)
          wx.setStorageSync('tasks', filteredTasks)
          
          wx.showToast({
            title: '任务已删除',
            icon: 'success'
          })
          
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  }
})
