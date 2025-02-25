// pages/profile/profile.js
const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        userInfo: null,
        trainingRecords: [],
        isRecordsExpanded: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 移除这里的跳转逻辑
        // if (app.globalData.userInfo) {
        //   wx.reLaunch({ url: '/pages/index/index' })
        // }
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
        const user = app.globalData.userInfo
        if (user) {
            const records = wx.getStorageSync('schulteRecords')?.[user.openid] || []
            this.setData({
                userInfo: user,
                trainingRecords: records.map(r => ({
                    ...r,
                    date: new Date(r.date).toLocaleString(),
                    time: typeof r.time === 'number' ? r.time : parseFloat(r.time)
                })).sort((a, b) => a.time - b.time)
            })
        }
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
            desc: '用于展示用户信息',
            success: (res) => {
                app.globalData.userInfo = res.userInfo
                wx.setStorageSync('userInfo', res.userInfo)
                this.setData({
                    userInfo: res.userInfo
                })
                wx.reLaunch({ url: '/pages/profile/profile' })
            },
            fail: (err) => {
                wx.showToast({
                    title: '登录已取消',
                    icon: 'none'
                })
            }
        })
    },

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${minutes}分${seconds.toString().padStart(2, '0')}秒`
    },

    toggleRecords() {
        this.setData({ 
            isRecordsExpanded: !this.data.isRecordsExpanded 
        })
    }
})