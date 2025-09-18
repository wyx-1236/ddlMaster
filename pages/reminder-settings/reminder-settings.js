// pages/reminder-settings/reminder-settings.js
Page({
  data: {
    reminderEnabled: true,
    checkInterval: 1, // 检查间隔（分钟）
    intervalIndex: 0, // 当前选中的间隔索引
    intervalOptions: [1, 3, 5, 10], // 可选的间隔选项
    soundEnabled: true,
    vibrationEnabled: true,
    subscribed: false,
    subscriptionStatus: '未订阅' // 订阅状态显示
  },

  onLoad() {
    this.loadSettings()
  },

  // 加载设置
  loadSettings() {
    const reminderEnabled = wx.getStorageSync('reminderEnabled') !== false
    const checkInterval = wx.getStorageSync('reminderCheckInterval') || 1
    const soundEnabled = wx.getStorageSync('reminderSoundEnabled') !== false
    const vibrationEnabled = wx.getStorageSync('reminderVibrationEnabled') !== false
    const subscribed = wx.getStorageSync('reminderSubscribed') || false

    // 计算当前间隔在选项中的索引
    const intervalIndex = this.data.intervalOptions.indexOf(checkInterval)
    const finalIntervalIndex = intervalIndex !== -1 ? intervalIndex : 0

    this.setData({
      reminderEnabled,
      checkInterval,
      intervalIndex: finalIntervalIndex,
      soundEnabled,
      vibrationEnabled,
      subscribed,
      subscriptionStatus: subscribed ? '已订阅' : '未订阅'
    })
  },

  // 切换提醒开关
  toggleReminder(e) {
    const enabled = e.detail.value
    this.setData({ reminderEnabled: enabled })
    wx.setStorageSync('reminderEnabled', enabled)
    
    const app = getApp()
    if (enabled) {
      app.startReminderCheck()
    } else {
      app.stopReminderCheck()
    }
  },

  // 设置检查间隔
  onIntervalChange(e) {
    const index = parseInt(e.detail.value)
    const interval = this.data.intervalOptions[index]
    this.setData({ 
      checkInterval: interval,
      intervalIndex: index
    })
    wx.setStorageSync('reminderCheckInterval', interval)
    
    // 如果提醒已启用，重新启动定时器
    if (this.data.reminderEnabled) {
      const app = getApp()
      app.stopReminderCheck()
      app.startReminderCheck()
    }
  },

  // 切换声音提醒
  toggleSound(e) {
    const enabled = e.detail.value
    this.setData({ soundEnabled: enabled })
    wx.setStorageSync('reminderSoundEnabled', enabled)
  },

  // 切换震动提醒
  toggleVibration(e) {
    const enabled = e.detail.value
    this.setData({ vibrationEnabled: enabled })
    wx.setStorageSync('reminderVibrationEnabled', enabled)
  },

  // 订阅消息
  subscribeMessage() {
    wx.requestSubscribeMessage({
        tmplIds: ['0GIbahOKXXqJ7Sxpdbw_r5mNiLT-YTiIR4UJaS2aIVs'], // 您的订阅消息模板ID
      success: (res) => {
        if (res['0GIbahOKXXqJ7Sxpdbw_r5mNiLT-YTiIR4UJaS2aIVs'] === 'accept') {
          // 用户同意订阅，调用后端API
          this.subscribeToBackend()
        } else {
          wx.showToast({
            title: '订阅失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.log('订阅失败:', err)
        wx.showToast({
          title: '订阅失败',
          icon: 'none'
        })
      }
    })
  },

  // 向后端订阅
  subscribeToBackend() {
    const app = getApp()
    
    // 显示加载提示
    wx.showLoading({
      title: '正在订阅...',
      mask: true
    })
    
    app.getUserOpenId().then(openid => {
      if (openid) {
        wx.request({
          url: 'https://your-backend-domain.com/api/subscribe', // 请替换为您的实际后端地址
          method: 'POST',
          data: {
            openid: openid,
            templateId: '0GIbahOKXXqJ7Sxpdbw_r5mNiLT-YTiIR4UJaS2aIVs' // 您的订阅消息模板ID
          },
          success: (res) => {
            wx.hideLoading()
            console.log('订阅响应:', res.data)
            if (res.data.success) {
              this.setData({ 
                subscribed: true,
                subscriptionStatus: '已订阅'
              })
              wx.setStorageSync('reminderSubscribed', true)
              wx.showToast({
                title: '订阅成功',
                icon: 'success'
              })
            } else {
              wx.showToast({
                title: '订阅失败: ' + (res.data.message || '未知错误'),
                icon: 'error',
                duration: 3000
              })
            }
          },
          fail: (err) => {
            wx.hideLoading()
            console.error('后端订阅失败:', err)
            wx.showToast({
              title: '网络请求失败，请检查网络连接',
              icon: 'error',
              duration: 3000
            })
          }
        })
      } else {
        wx.hideLoading()
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'error'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('获取openid失败:', err)
      wx.showToast({
        title: '获取用户信息失败: ' + err.message,
        icon: 'error',
        duration: 3000
      })
    })
  },

  // 取消订阅
  unsubscribeMessage() {
    wx.showModal({
      title: '取消订阅',
      content: '确定要取消微信推送通知吗？取消后将无法在微信中接收提醒。',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('reminderSubscribed', false)
          this.setData({
            subscribed: false,
            subscriptionStatus: '未订阅'
          })
          wx.showToast({
            title: '已取消订阅',
            icon: 'success'
          })
        }
      }
    })
  },

  // 测试提醒
  testReminder() {
    wx.showModal({
      title: '🔔 测试提醒',
      content: '这是一个测试提醒，如果您看到这个弹窗，说明提醒功能正常工作。',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
