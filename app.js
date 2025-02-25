// app.js
App({
  globalData: {
    userInfo: null
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
