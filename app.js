// app.js
App({
  globalData: {
    userInfo: null,
    isGuest: false, // 新增游客模式标识
    glmApiKey: '33b333df733a7ba7174034ef5d757c8f.1MlCkHLb22BysIPi', // 请替换为实际API Key
    glmBaseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions' // 修正API地址
  },

  onLaunch() {
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
  }
})
