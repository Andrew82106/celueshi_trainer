// index.js
const app = getApp()

Page({
  onShow() {
      console.log("userData debug in index.js:")
      console.log(app.globalData.userInfo)
      console.log(app.globalData.userInfo.isTourist)
    if (!app.globalData.userInfo) {
      wx.redirectTo({ url: '/pages/main/main' })
    }
  },
  navigateToDotTraining() {
    wx.navigateTo({
      url: '/pages/dot-training/dot-training'
    })
  },
  navigateToSchulte() {
    wx.navigateTo({
      url: '/pages/schulte-table/schulte-table'
    })
  },
  navigateToAudioTraining() {
    wx.navigateTo({
      url: '/pages/audio-training/audio-training'
    })
  },
  navigateToProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/introduction/introduction'
    })
  },
  navigateTranslate() {
    wx.navigateTo({
        url: '/pages/translate-training/translate-training'
      })
  }
})
