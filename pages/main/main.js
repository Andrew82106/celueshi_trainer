// pages/main/main.js
const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
      if (app.globalData.userInfo) {
        wx.reLaunch({ url: '/pages/index/index' })
      }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    },

    handleLogin() {
      wx.getUserProfile({
        desc: '用于记录训练数据',
        success: res => {
          // 存储基础用户信息
          const userData = {
            ...res.userInfo,
            openid: app.globalData.openid // 确保有唯一标识
          };
          userData.nickName = "未登录";
          userData.isLogin = false;
          userData.isTourist = false;
          app.globalData.userInfo = userData;
          app.globalData.isGuest = false;
          wx.setStorageSync('userInfo', userData);
          console.log("in handleLogin")
          console.log(userData)
          // 跳转到信息完善页面
          wx.reLaunch({ url: '/pages/login/login' });
        },
        fail: () => {
          wx.showToast({ title: '登录失败', icon: 'error' })
        }
      })
    },

    tuoristLogin() {
      // 游客模式
      app.globalData.isGuest = true
      app.globalData.userInfo = { nickName: '游客' ,isTourist: true}
      wx.reLaunch({ url: '/pages/index/index' })
    }
})