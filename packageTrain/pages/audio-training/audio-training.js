Page({
  data: {
    step: 1, // 1-选择长度 2-训练中 3-结果展示
    numberLength: 5,
    originalNumbers: '',
    userInput: '',
    showNumbers: true,
    isCorrect: false,
    showInput: false,
    currentPlayingNumber: '', // 新增当前播放数字
    reversedNumbers: '', // 新增反转数据存储
    lastUsedLength: 5, // 缓存最后使用的长度
    numberDisplayClass: '', // 添加类名变量
    isGuest: false,
    trainingRecords: [] // 添加当前会话的记录数组
  },

  // 处理长度选择
  handleLengthChange(e) {
    this.setData({ numberLength: e.detail.value });
    wx.setStorageSync('lastAudioLength', e.detail.value); // 缓存用户选择的长度
  },

  // 处理输入事件
  onInput(e) {
    console.log('[输入事件] 值:', e.detail.value);
    this.setData({ userInput: e.detail.value });
  },

  // 开始训练
  startTraining() {
    const length = wx.getStorageSync('lastAudioLength') || this.data.numberLength;
    const numbers = Array.from({length}, () => Math.floor(Math.random()*10)).join('');
    
    // 根据数字长度设置额外的类名
    let numberDisplayClass = '';
    if (length > 10 && length <= 15) {
      numberDisplayClass = 'long-number';
    } else if (length > 15) {
      numberDisplayClass = 'very-long-number';
    }
    
    this.setData({
      step: 2,
      originalNumbers: numbers,
      showNumbers: true,
      userInput: '',
      numberLength: length,
      numberDisplayClass: numberDisplayClass // 添加类名变量
    });

    this.playNumberAudio(numbers).then(() => {
      this.setData({ 
        showNumbers: false,
        showInput: true
      });
    });
  },

  // 播放数字音频
  async playNumberAudio(numbers) {
    console.log('[调试] 开始播放数字序列:', numbers);
    
    try {
        for (const [index, num] of numbers.split('').entries()) {
            const ctx = wx.createInnerAudioContext(); // 每个数字创建新实例
            this.setData({ currentPlayingNumber: num });
            console.log(`[调试] 准备播放第${index + 1}个数字: ${num}`);
            const audioPath = `/assets/vedio/number_voice/${num}.wav`; // 注意路径拼写应为video

            await new Promise((resolve, reject) => {
                ctx.src = audioPath;
                ctx.onCanplay(() => {
                    console.log(`[调试] 音频${num}可播放`);
                    ctx.play();
                });
                ctx.onError(err => {
                    console.error(`[错误] 播放失败:`, err);
                    ctx.destroy();
                    reject(err);
                });
                ctx.onEnded(() => {
                    ctx.destroy(); // 播放完成立即销毁
                    resolve();
                });
            });
        }
    } catch (err) {
        console.error('播放流程异常:', err);
    }
  },

  // 验证输入
  validateInput() {
    const original = this.data.originalNumbers;
    const reversed = original.split('').reverse().join('');
    const userInput = this.data.userInput.trim();
    
    this.setData({
        reversedNumbers: reversed, // 新增反转数据存储
        lastUsedLength: this.data.numberLength // 缓存最后使用的长度
    });

    wx.setStorageSync('lastAudioLength', this.data.numberLength); // 持久化存储

    console.log('[调试] 原始数字:', original);
    console.log('[调试] 正确反转:', reversed);
    console.log('[调试] 用户输入:', userInput);
    console.log('[调试] 严格相等比较:', userInput === reversed);
    
    const isCorrect = userInput === reversed;
    
    if (isCorrect) {
      this.saveRecord();
    }

    this.setData({
      step: 3,
      isCorrect,
      showNumbers: true
    });

    const record = {
        number: original,  // 修改字段名
        reversed: original.split('').reverse().join(''), // 保持字段名
        userInput: userInput,
        length: original.length,
        isCorrect: isCorrect,
        date: new Date().toISOString()
    };
  },

  // 保存记录
  saveRecord() {
    const record = {
      date: new Date().toISOString(),
      length: this.data.numberLength,
      numbers: this.data.originalNumbers,
      reversed: this.data.reversedNumbers
    };
    
    // 更新当前会话中显示的记录（游客模式也可以查看本次会话记录）
    this.setData({
      trainingRecords: [record, ...this.data.trainingRecords]
    });
    
    // 只有非游客模式才永久存储数据
    if (!this.data.isGuest && getApp().globalData.userInfo) {
      const user = getApp().globalData.userInfo;
      const records = wx.getStorageSync('audioRecords') || {};
      records[user.openid] = [...(records[user.openid] || []), record];
      wx.setStorageSync('audioRecords', records);
    }
  },

  // 继续训练
  continueTraining() {
    this.startTraining(); // 直接开始训练
  },

  navigateBack() {
    wx.navigateBack()
  },

  onLoad(options) {
    const app = getApp();
    this.setData({
      isGuest: app.globalData.isGuest || false
    });
    
    const cachedLength = wx.getStorageSync('lastAudioLength') || 5;
    this.setData({ numberLength: cachedLength });
  }
}) 