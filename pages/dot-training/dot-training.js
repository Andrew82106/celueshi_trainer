Page({
  data: {
    minDots: 2,
    maxDots: 5,
    displayTime: 1,
    isTraining: false,
    countdown: 3,
    dots: [],
    showInput: false,
    userAnswer: '',
    correctCount: 0,
    trainingRecords: [],
    savedSettings: null
  },

  onLoad() {
    this.timer = null
  },

  // 验证输入范围
  validateRange(e) {
    const { field } = e.currentTarget.dataset
    let value = parseInt(e.detail.value) || 0
    value = Math.max(2, Math.min(20, value))
    this.setData({ [field]: value })
  },

  // 验证时间输入
  validateTime(e) {
    let value = parseFloat(e.detail.value) || 0
    value = Math.max(0.1, Math.min(3, value))
    this.setData({ displayTime: value.toFixed(1) })
  },

  // 开始训练流程
  startTraining() {
    const settings = this.data.savedSettings || {
      min: this.data.minDots,
      max: this.data.maxDots,
      time: this.data.displayTime
    }

    if (!this.data.savedSettings) {
      this.setData({
        savedSettings: {...settings}
      })
    }

    this.setData({ 
      isTraining: true,
      countdown: 3,
      dots: []
    })
    this.runCountdown()
  },

  // 3秒倒计时
  runCountdown() {
    if (this.data.countdown > 0) {
      this.timer = setTimeout(() => {
        this.setData({ countdown: this.data.countdown - 1 })
        this.runCountdown()
      }, 1000)
    } else {
      this.generateDots()
    }
  },

  // 生成随机圆点
  generateDots() {
    const count = this.getRandomCount()
    const dots = []
    const screenWidth = wx.getSystemInfoSync().screenWidth
    const screenHeight = wx.getSystemInfoSync().screenHeight - 100
    const displayTime = this.data.savedSettings.time * 1000

    for (let i = 0; i < count; i++) {
      let newDot
      do {
        newDot = {
          x: Math.random() * (screenWidth - 40),
          y: Math.random() * (screenHeight - 40),
          size: 20
        }
      } while (this.checkOverlap(newDot, dots))
      
      dots.push(newDot)
    }

    this.setData({ dots })
    setTimeout(() => {
      this.setData({ showInput: true })
    }, this.data.savedSettings.time * 1000)
  },

  // 检查圆点是否重叠
  checkOverlap(newDot, existingDots) {
    return existingDots.some(dot => {
      const distance = Math.sqrt(
        Math.pow(dot.x - newDot.x, 2) + 
        Math.pow(dot.y - newDot.y, 2)
      )
      return distance < 40 // 保持至少40px间距
    })
  },

  // 获取随机数量
  getRandomCount() {
    const min = this.data.savedSettings.min
    const max = this.data.savedSettings.max
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  // 处理用户输入
  handleInput(e) {
    this.setData({ userAnswer: e.detail.value })
  },

  // 提交答案
  submitAnswer() {
    const correct = parseInt(this.getRandomCount())
    const userAns = parseInt(this.data.userAnswer)
    
    if (userAns === correct) {
        this.saveRecord(correct)
        wx.showModal({
            title: '正确！',
            content: `你答对了，本次数量：${correct}`,
            showCancel: false,
            complete: () => {
                this.setData({ 
                    showInput: false,
                    userAnswer: '',
                    isTraining: false,
                    dots: this.data.dots
                })
            }
        })
    } else {
        wx.showModal({
            title: '错误',
            content: `正确答案是：${correct}`,
            showCancel: false,
            complete: () => {
                this.setData({ 
                    showInput: false,
                    userAnswer: '',
                    isTraining: false,
                    dots: this.data.dots
                })
            }
        })
    }
  },

  // 保存记录（参考舒尔特表存储逻辑 startLine:146-153）
  saveRecord(correct) {
    const record = {
      correct,
      userAnswer: this.data.userAnswer,
      time: new Date().toISOString()
    }
    this.setData({
      trainingRecords: [...this.data.trainingRecords, record]
    })

    const user = getApp().globalData.userInfo
    if (user) {
      const records = wx.getStorageSync('dotRecords') || {}
      records[user.openid] = records[user.openid] || []
      records[user.openid].push(record)
      wx.setStorageSync('dotRecords', records)
    }
  },

  // 结束训练
  endTraining() {
    clearTimeout(this.timer)
    wx.reLaunch({ url: '/pages/index/index' })
  },

  stopTraining() {
    clearTimeout(this.timer)
    this.setData({ isTraining: false, dots: [], countdown: 0 })
  }
}) 