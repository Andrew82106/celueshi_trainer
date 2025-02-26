// pages/translate-train-records/translate-train-records.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        evaluationResult: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        try {
            const result = JSON.parse(decodeURIComponent(options.result))
            console.log('[DEBUG] 参考译文数据：', result.details.map(d => d.reference))
            
            this.setData({
                evaluationResult: {
                    ...result,
                    accuracy: result.accuracy + '%'
                }
            })
        } catch (e) {
            wx.showToast({ title: '数据加载失败', icon: 'none' })
            setTimeout(() => wx.navigateBack(), 1500)
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

    onBack() {
        wx.navigateBack()
    },

    goHome() {
        wx.reLaunch({
            url: '/pages/index/index' // 根据实际主页路径调整
        })
    }
})