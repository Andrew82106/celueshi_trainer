// app.js
App({
  globalData: {
    userInfo: null,
    isGuest: false, // 新增游客模式标识
    glmApiKey: '33b333df733a7ba7174034ef5d757c8f.1MlCkHLb22BysIPi', // 请替换为实际API Key
    glmBaseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', // 修正API地址
    
    // 木鱼统计数据
    muyuRecords: {},       // 木鱼按日期记录的数据
    muyuTodayCount: 0,     // 今日木鱼敲击次数
    muyuTotalCount: 0,     // 总木鱼敲击次数
    
    // 颂钵统计数据
    songboRecords: {},     // 颂钵按日期记录的数据 
    songboTodayCount: 0,   // 今日颂钵敲击次数
    songboTotalCount: 0    // 总颂钵敲击次数
  },

  onLaunch() {
    // 初始化木鱼和颂钵的记录数据
    this.initStatisticsData();
    
    const user = wx.getStorageSync('userInfo');
    console.log("in app.js")
    
    if (user) {
      this.globalData.userInfo = user;
      console.log(user)
      if (user.isLogin == false && user.isTourist == false) {
        console.log("in app.js, user.isLogin == false && user.isTourist == false")
        wx.reLaunch({ url: '/pages/login/login' });
      }
      else if (user.nickName == "微信用户") {
        console.log("in app.js, user.nickName == 微信用户")
        wx.reLaunch({ url: '/pages/login/login' });
      }
      else if (user.nickName && user.avatarUrl) {
        console.log("in app.js, user.nickName && user.avatarUrl")
        wx.reLaunch({ url: '/pages/index/index' });
      }
      else {
        console.log("in app.js, else")
        wx.reLaunch({ url: '/pages/login/login' });
      }
    } else {
      wx.reLaunch({ url: '/pages/main/main' });
    }
  },

  checkLogin() {
    return new Promise((resolve) => {
      if (this.globalData.userInfo) return resolve(true)
      const user = wx.getStorageSync('userInfo')
      
      if (user) {
        this.globalData.userInfo = user
        resolve(true)
      } else {
        resolve(false)
      }
    })
  },

  // 初始化统计数据
  initStatisticsData() {
    // 获取木鱼记录
    const muyuRecords = wx.getStorageSync('muyuRecords') || {};
    this.globalData.muyuRecords = muyuRecords;
    
    // 获取颂钵记录
    const songboRecords = wx.getStorageSync('songboRecords') || {};
    this.globalData.songboRecords = songboRecords;
    
    // 获取今天的日期
    const today = this.getTodayDateString();
    
    // 计算木鱼今日次数和总次数
    this.globalData.muyuTodayCount = muyuRecords[today] || 0;
    let muyuTotal = 0;
    for (const date in muyuRecords) {
      muyuTotal += muyuRecords[date];
    }
    this.globalData.muyuTotalCount = muyuTotal;
    
    // 计算颂钵今日次数和总次数
    this.globalData.songboTodayCount = songboRecords[today] || 0;
    let songboTotal = 0;
    for (const date in songboRecords) {
      songboTotal += songboRecords[date];
    }
    this.globalData.songboTotalCount = songboTotal;
  },
  
  // 获取今天的日期字符串 (YYYY-MM-DD)
  getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
})
