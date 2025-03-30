Page({
  data: {
    content: '', // 感想内容
    characterCount: 0, // 感想字符数
    meditationCount: '', // 内观写作字数
    showTimer: true, // 是否显示计时器
    isTimerRunning: false, // 计时器是否运行中
    timerSeconds: 0, // 计时器秒数
    timerText: '00:00:00', // 计时器显示文本
    visible: true, // 是否在社区中可见
    prompts: [
      '今天的内观过程中，你注意到了什么身体感受？',
      '静坐时，你的思绪如何变化？有什么特别的发现吗？',
      '你观察到了哪些情绪的起伏？它们是如何出现和消失的？',
      '在安静中，有什么新的领悟或感悟吗？',
      '今天的内观与以往有什么不同？',
      '什么让你感到平静？什么让你感到不安？',
      '能否描述一下你的呼吸过程中的专注力变化？',
      '内观过程中，你对自己有了哪些新的认识？',
      '安静中，什么念头最常出现？它们告诉你什么？',
      '此刻，你最想对自己说什么？'
    ],
    currentPrompt: '' // 当前提示
  },

  onLoad: function (options) {
    // 随机选择一个提示
    this.refreshPrompt();
    
    // 初始化计时器定时器
    this.timerInterval = null;
  },

  onUnload: function () {
    // 页面卸载时清除计时器
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  },

  // 监听感想输入变化
  onInputChange: function (e) {
    const content = e.detail.value;
    this.setData({
      content: content,
      characterCount: content.length
    });
  },
  
  // 监听内观写作字数输入变化
  onMeditationCountChange: function (e) {
    let count = e.detail.value;
    
    // 确保只能输入数字
    count = count.replace(/\D/g, '');
    
    // 防止输入过大的数字
    if (parseInt(count) > 100000000000) {
      count = '100000000000';
    }
    
    this.setData({
      meditationCount: count
    });
  },

  // 刷新写作提示
  refreshPrompt: function () {
    const { prompts } = this.data;
    const randomIndex = Math.floor(Math.random() * prompts.length);
    this.setData({
      currentPrompt: prompts[randomIndex]
    });
  },

  // 切换计时器显示
  toggleTimerDisplay: function () {
    this.setData({
      showTimer: !this.data.showTimer
    });
  },

  // 切换计时器状态（开始/暂停）
  toggleTimer: function () {
    const { isTimerRunning } = this.data;
    
    if (isTimerRunning) {
      // 暂停计时器
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    } else {
      // 开始计时器
      this.timerInterval = setInterval(() => {
        const seconds = this.data.timerSeconds + 1;
        const timerText = this.formatTime(seconds);
        
        this.setData({
          timerSeconds: seconds,
          timerText: timerText
        });
      }, 1000);
    }
    
    this.setData({
      isTimerRunning: !isTimerRunning
    });
  },

  // 重置计时器
  resetTimer: function () {
    // 停止计时器
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.setData({
      timerSeconds: 0,
      timerText: '00:00:00',
      isTimerRunning: false
    });
  },

  // 格式化时间 (秒 -> HH:MM:SS)
  formatTime: function (totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [hours, minutes, seconds]
      .map(val => val < 10 ? `0${val}` : val)
      .join(':');
  },

  // 切换可见性设置
  toggleVisibility: function() {
    this.setData({
      visible: !this.data.visible
    });
  },

  // 提交写作内容
  submitWriting: function () {
    const { content, characterCount, meditationCount, visible } = this.data;
    
    // 验证内观写作字数
    if (!meditationCount) {
      wx.showToast({
        title: '请输入内观写作字数',
        icon: 'none'
      });
      return;
    }
    
    // 验证感想内容长度
    if (content.length < 10) {
      wx.showToast({
        title: '请至少输入10个字的感想',
        icon: 'none'
      });
      return;
    }
    
    const app = getApp();
    
    // 获取用户信息
    if (!app.globalData.userInfo || !app.globalData.userInfo.openId) {
      wx.showToast({
        title: '用户未登录',
        icon: 'none'
      });
      return;
    }
    
    const openId = app.globalData.userInfo.openId;
    
    // 获取当前日期
    const today = new Date();
    const date = today.getFullYear() + '-' + 
                 ('0' + (today.getMonth() + 1)).slice(-2) + '-' + 
                 ('0' + today.getDate()).slice(-2);
    
    // 显示加载提示
    wx.showLoading({
      title: '正在保存',
    });
    
    // 写入云数据库
    wx.cloud.database().collection('writelog').add({
      data: {
        openId: openId,
        date: date,
        content: content,
        count: parseInt(meditationCount), // 使用用户输入的内观写作字数
        insightCount: characterCount,     // 额外保存感想字数
        timestamp: Date.now(),
        visible: visible                  // 添加可见性字段
      }
    }).then(res => {
      console.log('写作内容保存成功', res);
      
      // 更新用户累计字数
      return wx.cloud.database().collection('userinfo').where({
        openId: openId
      }).get();
    }).then(res => {
      if (res.data && res.data.length > 0) {
        const userInfo = res.data[0];
        const currentCount = userInfo.accumulateCount || 0;
        const newCount = currentCount + parseInt(meditationCount); // 使用内观写作字数累加
        
        return wx.cloud.database().collection('userinfo').doc(userInfo._id).update({
          data: {
            accumulateCount: newCount
          }
        });
      }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      // 保存成功后，返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      console.error('保存写作内容失败', err);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    });
  }
}) 