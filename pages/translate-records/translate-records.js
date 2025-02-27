// pages/translate-records/translate-records.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        records: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.loadRecords();
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

    loadRecords() {
        try {
            const records = wx.getStorageSync('translateRecords') || [];
            this.setData({
                records: records.map(r => ({
                    ...r,
                    // 保持原始accuracy格式
                    accuracy: typeof r.accuracy === 'number' ? 
                        `${r.accuracy.toFixed(1)}%` : 
                        r.accuracy,
                    // 保持details结构完整
                    details: r.details.map(d => ({
                        source: d.source,
                        reference: d.reference,
                        userTranslation: d.userTranslation,
                        score: d.score,
                        suggestions: d.suggestions
                    }))
                }))
            });
        } catch (e) {
            console.error('加载记录失败:', e);
            wx.showToast({ title: '加载记录失败', icon: 'none' });
        }
        console.log('[DEBUG] 加载到的记录:', this.data.records);
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },

    viewDetail(e) {
        const index = e.currentTarget.dataset.index;
        const record = this.data.records[index];
        wx.navigateTo({
            url: `/pages/translate-train-records/translate-train-records?result=${encodeURIComponent(JSON.stringify(record))}`
        });
    },

    onBack() {
        wx.navigateBack();
    }
})