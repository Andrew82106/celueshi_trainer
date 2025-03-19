// pages/main/main.js
const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        userInfo: null,
        isLoading: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 检查全局用户信息
        this.setData({
            userInfo: app.globalData.userInfo
        });
        
        // 如果用户已经登录，直接跳转到首页
        if (app.globalData.userInfo && app.globalData.userInfo.isLogin) {
            wx.reLaunch({ url: '/pages/index/index' });
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

    // 微信登录处理
    handleLogin(e) {
        if (this.data.isLoading) return;
        
        this.setData({ isLoading: true });
        
        wx.reLaunch({
            url: '/pages/login/login'
        });
        
    },

    // 游客登录处理
    touristLogin() {
        // 设置游客信息
        const userInfo = {
            nickName: '游客',
            avatarUrl: '',
            isTourist: true,
            isLogin: false
        };
        
        // 保存到全局变量和本地
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        
        // 跳转到首页
        wx.reLaunch({ url: '/pages/index/index' });
    }
})