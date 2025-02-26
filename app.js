// app.js
App({
  globalData: {
    userInfo: null,
    glmApiKey: '33b333df733a7ba7174034ef5d757c8f.1MlCkHLb22BysIPi', // 请替换为实际API Key
    glmBaseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions' // 修正API地址
  },

  onLaunch() {
    const user = wx.getStorageSync('userInfo')
    if (user) {
      this.globalData.userInfo = user
    } else {
      console.log("login")
      wx.reLaunch({ url: 'pages/main/main' })
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
