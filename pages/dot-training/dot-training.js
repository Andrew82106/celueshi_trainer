Page({
  data: {
    minDots: 2,
    maxDots: 5,
    seconds: 1,
    milliseconds: 0,
    displayTime: 1,
    isTraining: false,
    countdown: 3,
    dots: [],
    showInput: false,
    userAnswer: '',
    correctCount: 0,
    trainingRecords: [],
    savedSettings: null,
    correctAnswer: null,
    cachedDots: [],
    millisecondsIndex: 0,
    millisecondsOptions: ['000', '250', '500', '750']
  },

  onLoad() {
    this.timer = null
    console.log('[DEBUG] 页面初始化，毫秒选项:', this.data.millisecondsOptions)
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

  // 重构后的时间处理函数
  handleTimeChange(e) {
    console.log('[DEBUG] 当前毫秒选项:', this.data.millisecondsOptions)
    console.log('[DEBUG] 接收到的picker值:', e.detail.value)
    const type = e.currentTarget.dataset.type
    const value = parseInt(e.detail.value)
    
    console.log('[DEBUG] 时间选择事件:', type, '原始值:', value)
    
    if (type === 'milliseconds') {
        const msValue = value * 250 // 0=>0, 1=>250, 2=>500, 3=>750
        console.log('[DEBUG] 毫秒转换:', value, '=>', msValue)
        this.setData({ milliseconds: msValue })
    } else {
        console.log('[DEBUG] 秒数设置:', value)
        this.setData({ seconds: value })
    }

    // 计算总时间
    const totalTime = this.data.seconds + (this.data.milliseconds / 1000)
    console.log('[DEBUG] 当前总时间:', totalTime.toFixed(3), '秒')
    
    this.setData({ displayTime: totalTime.toFixed(3) })
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
      dots: [],
      correctAnswer: null,
      startTime: Date.now()
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
      const correct = this.generateDots()
      this.setData({ correctAnswer: correct })
    }
  },

  // 生成随机圆点
  generateDots() {
    const count = this.getRandomCount()
    const dots = []
    
    // 调试用：在四个角生成固定坐标点
    const debugPoints = [
        {x: 0, y: 0, size: 40, isDebug: true},
        {x: 710, y: 0, size: 40, isDebug: true},
        {x: 0, y: 600, size: 40, isDebug: true},
        {x: 710, y: 600, size: 40, isDebug: true}
    ]
    
    // 正式生成逻辑
    for (let i = 0; i < count; i++) {
      let newDot
      do {
        // 生成在边框内的坐标（保留5rpx安全边距）
        const x = Math.random() * (710 - 10) + 5
        const y = Math.random() * (600 - 10) + 5
        
        newDot = {
          x: x,
          y: y,
          size: 20 // 20rpx
        }
      } while (this.checkOverlap(newDot, dots) || this.isOutOfBounds(newDot))
      //debug：打印圆点坐标
      console.log(newDot)
      newDot.isDebug = false // 标记为非调试点
      dots.push(newDot)
    }

    // 合并调试点
    this.setData({ 
        dots: [...debugPoints, ...dots],
        cachedDots: [...debugPoints, ...dots]
    })
    setTimeout(() => {
        this.setData({ 
            showInput: true,
            dots: [] // 清空显示但保留缓存
        })
    }, this.data.savedSettings.time * 1000)
    return count
  },

  // 检查圆点是否重叠
  checkOverlap(newDot, existingDots) {
    return existingDots.some(dot => {
      const distance = Math.sqrt(
        Math.pow(dot.x - newDot.x, 2) + 
        Math.pow(dot.y - newDot.y, 2)
      )
      return distance < 5 // 保持至少30rpx间距
    })
  },

  // 检查圆点是否超出边框范围
  isOutOfBounds(dot) {
    const areaWidth = 710 // rpx (750-20*2)
    const areaHeight = 600 // rpx
    
    return (
      dot.x < 0 || 
      dot.x > areaWidth ||
      dot.y < 0 ||
      dot.y > areaHeight
    )
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
    const correct = this.data.correctAnswer;
    const userAns = parseInt(this.data.userAnswer);
    
    if (userAns === correct) {
        this.saveRecord(correct)
        wx.showModal({
            title: '正确！',
            content: `你答对了,本次数量：${correct}`,
            showCancel: false,
            complete: () => {
                this.setData({ 
                    showInput: false,
                    userAnswer: '',
                    isTraining: true, // 保持训练状态
                    dots: this.data.cachedDots // 从缓存恢复
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
                    isTraining: true, // 保持训练状态
                    dots: this.data.cachedDots // 从缓存恢复
                })
            }
        })
    }
  },

  // 保存记录（参考舒尔特表存储逻辑 startLine:146-153）
  saveRecord(correct) {
    const duration = (Date.now() - this.data.startTime) / 1000; // 计算秒数
    const record = {
      correct,
      userAnswer: this.data.userAnswer,
      date: new Date().toISOString(),
      displayTime: this.data.displayTime,
      milliseconds: this.data.milliseconds
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
  },

  // 新增继续训练方法
  continueTraining() {
    this.setData({ 
        dots: [],
        cachedDots: []
    })
    this.startTraining()
  },

  bindMinChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({ minDots: index + 2 })
  },

  bindMaxChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({ maxDots: index + 2 })
  },
}) 