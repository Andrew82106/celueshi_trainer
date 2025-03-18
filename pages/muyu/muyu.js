const app = getApp();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        count: 0,           // 今日敲击计数
        totalCount: 0,      // 总敲击计数
        isAnimating: false, // 木鱼动画状态
        showModal: false,   // 模态框显示状态
        interval: 1.0,      // 自动敲击间隔（秒）
        isAutoTapping: false, // 是否正在自动敲击
        autoTapTimer: null,  // 自动敲击定时器
        today: ''           // 当前日期
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 获取今天的日期字符串 (格式: YYYY-MM-DD)
        const today = this.getTodayDateString();
        
        // 从缓存中读取所有敲击记录
        const muyuRecords = wx.getStorageSync('muyuRecords') || {};
        const todayCount = muyuRecords[today] || 0;
        
        // 计算总计数
        let totalCount = 0;
        for (const date in muyuRecords) {
            totalCount += muyuRecords[date];
        }
        
        this.setData({
            count: todayCount,
            totalCount: totalCount,
            today: today
        });
    },
    
    /**
     * 获取今天的日期字符串 (YYYY-MM-DD)
     */
    getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 敲击木鱼
     */
    tapMuyu() {
        // 更新今日计数
        const newCount = this.data.count + 1;
        const newTotalCount = this.data.totalCount + 1;
        
        this.setData({
            count: newCount,
            totalCount: newTotalCount,
            isAnimating: true
        });
        
        // 保存计数到缓存
        this.saveCountToStorage(newCount);
        
        // 播放音效
        this.playSound();
        
        // 动画效果
        setTimeout(() => {
            this.setData({
                isAnimating: false
            });
        }, 100);
    },
    
    /**
     * 保存计数到缓存
     */
    saveCountToStorage(count) {
        // 读取现有记录
        const muyuRecords = wx.getStorageSync('muyuRecords') || {};
        
        // 更新今日记录
        muyuRecords[this.data.today] = count;
        
        // 保存回缓存
        wx.setStorageSync('muyuRecords', muyuRecords);
        
        // 同时更新全局数据，方便"我的"页面读取
        if (app.globalData) {
            app.globalData.muyuRecords = muyuRecords;
            app.globalData.muyuTodayCount = count;
            app.globalData.muyuTotalCount = this.data.totalCount;
        }
    },
    
    /**
     * 播放木鱼敲击音效
     */
    playSound() {
        const innerAudioContext = wx.createInnerAudioContext();
        innerAudioContext.autoplay = true;
        
        // 木鱼音效路径，后续需要添加实际的音效文件
        // TODO: 添加木鱼音效文件到 assets/vedio/muyu.mp3
        innerAudioContext.src = '/assets/vedio/muyu.mp3';
        
        innerAudioContext.onError((res) => {
            console.log('音频播放失败：', res);
            // 当音频无法播放时，不阻止其他功能正常运行
        });
    },
    
    /**
     * 显示设置模态框
     */
    showSettingsModal() {
        this.setData({
            showModal: true
        });
    },
    
    /**
     * 隐藏设置模态框
     */
    hideSettingsModal() {
        this.setData({
            showModal: false
        });
    },
    
    /**
     * 滑块改变事件
     */
    sliderChange(e) {
        this.setData({
            interval: e.detail.value
        });
    },
    
    /**
     * 开始自动敲击
     */
    startAutoTap() {
        // 隐藏模态框
        this.hideSettingsModal();
        
        // 如果已经在自动敲击中，先清除定时器
        if (this.data.isAutoTapping && this.data.autoTapTimer) {
            clearInterval(this.data.autoTapTimer);
        }
        
        // 设置自动敲击状态
        this.setData({
            isAutoTapping: true
        });
        
        // 显示提示
        wx.showToast({
            title: '自动敲击已开启',
            icon: 'success',
            duration: 1500
        });
        
        // 设置定时器，定期自动敲击
        const timer = setInterval(() => {
            this.tapMuyu();
        }, this.data.interval * 1000); // 转换为毫秒
        
        // 保存定时器ID
        this.setData({
            autoTapTimer: timer
        });
    },
    
    /**
     * 停止自动敲击
     */
    stopAutoTap() {
        if (this.data.autoTapTimer) {
            clearInterval(this.data.autoTapTimer);
            this.setData({
                isAutoTapping: false,
                autoTapTimer: null
            });
            
            wx.showToast({
                title: '自动敲击已停止',
                icon: 'none',
                duration: 1500
            });
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
        // 页面隐藏时停止自动敲击
        this.stopAutoTap();
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        // 页面卸载时停止自动敲击
        this.stopAutoTap();
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

    }
}) 