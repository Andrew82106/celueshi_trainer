// pages/translate-drill/translate-drill.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        currentIndex: 0,
        content: [],
        userTranslations: [],
        isSubmitting: false,
        title: '',
        currentItem: {}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('[DEBUG] 页面参数:', options);
        console.log('[DEBUG] 原始content参数:', options.content);
        
        if (!options.content) {
            wx.showToast({ title: '缺少训练内容参数', icon: 'none' });
            setTimeout(() => wx.navigateBack(), 2000);
            return;
        }

        try {
            const content = JSON.parse(decodeURIComponent(options.content));
            console.log('[调试] 原始解析内容:', content);
            
            this.setData({
                content: content.map(item => ({
                    source: item.source || '（无原文）',
                    reference: item.reference || '（无参考译文）'
                })),
                title: decodeURIComponent(options.title || '翻译训练'),
                userTranslations: new Array(content.length).fill(''),
                currentItem: {}
            }, () => {
                console.log('[调试] 初始化完成后的content:', this.data.content);
                this.updateCurrentItem();
            });
            
            console.log('[调试] 初始化后的页面数据:', this.data);
        } catch (e) {
            console.error('[调试] 参数解析错误:', e);
            wx.showToast({ title: '内容格式错误', icon: 'none' });
            setTimeout(() => wx.navigateBack(), 2000);
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

    updateCurrentItem() {
        this.setData({
            currentItem: this.data.content[this.data.currentIndex] || {}
        });
    },

    handleTranslationInput(e) {
        const value = e.detail.value;
        this.setData({
            [`userTranslations[${this.data.currentIndex}]`]: value
        });
    },

    handlePrev() {
        if (this.data.currentIndex > 0) {
            this.setData({
                currentIndex: this.data.currentIndex - 1
            }, this.updateCurrentItem);
        }
    },

    handleNext() {
        if (!this.data.userTranslations[this.data.currentIndex]) {
            wx.showToast({ title: '请完成当前翻译', icon: 'none' });
            return;
        }

        if (this.data.currentIndex < this.data.content.length - 1) {
            this.setData({
                currentIndex: this.data.currentIndex + 1
            }, this.updateCurrentItem);
        }
    },

    submitAllTranslations() {
        if (this.data.isSubmitting) return;
        
        const missingTranslations = this.data.userTranslations.some(t => !t.trim());
        if (missingTranslations) {
            return wx.showToast({ title: '请完成所有翻译', icon: 'none' });
        }

        wx.navigateTo({
            url: `/pages/translate-review/translate-review?content=${encodeURIComponent(JSON.stringify(this.data.content))}&translations=${encodeURIComponent(JSON.stringify(this.data.userTranslations))}`
        });
        console.log('[DEBUG] 传递的原文数据：', this.data.content);
        //debug
        console.log('[DEBUG] 传递的翻译数据：', this.data.userTranslations);
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
    },

    onBack() {
        wx.navigateBack();
    }
})