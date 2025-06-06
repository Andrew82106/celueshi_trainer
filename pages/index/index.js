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
      url: '/packageTrain/pages/dot-training/dot-training'
    })
  },
  navigateToSchulte() {
    wx.navigateTo({
      url: '/packageTrain/pages/schulte-table/schulte-table'
    })
  },
  navigateToAudioTraining() {
    wx.navigateTo({
      url: '/packageTrain/pages/audio-training/audio-training'
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
        url: '/packageTrain/pages/translate-training/translate-training'
      })
  },
  navigateToShanmen() {
    wx.navigateTo({
      url: '/pages/shanmen/shanmen'
    })
  }
})
