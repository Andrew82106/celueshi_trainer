// pages/translate-review/translate-review.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        content: [],
        userTranslations: [],
        showEvaluation: false,
        evaluationResult: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.setData({
            content: JSON.parse(decodeURIComponent(options.content)),
            userTranslations: JSON.parse(decodeURIComponent(options.translations))
        });
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

    navigateBackToEdit() {
        wx.navigateBack();
    },

    startEvaluation() {
        // 调用LLM评估接口
        const evaluationResult = this.mockLLMEvaluation();
        
        wx.navigateTo({
            url: `/pages/translate-train-records/translate-train-records?result=${encodeURIComponent(JSON.stringify(evaluationResult))}`
        });
    },

    mockLLMEvaluation() {
        return {
            accuracy: Math.random().toFixed(2),
            details: this.data.content.map((item, index) => ({
                source: item.source,
                reference: item.reference,
                userTranslation: this.data.userTranslations[index],
                score: Math.random().toFixed(2)
            }))
        };
    }
})