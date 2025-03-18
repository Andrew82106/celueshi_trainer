const app = getApp();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        userInfo: {},           // 用户信息
        muyuTodayCount: 0,      // 今日木鱼敲击次数
        muyuTotalCount: 0,      // 总木鱼敲击次数
        muyuStreakDays: 0,      // 木鱼连续天数
        songboTodayCount: 0,    // 今日颂钵敲击次数
        songboTotalCount: 0,    // 总颂钵敲击次数
        songboStreakDays: 0,    // 颂钵连续天数
        daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],  // 星期标签
        calendarDays: [],       // 日历天数数据
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 加载用户信息
        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo
            });
        }
        
        // 加载统计数据
        this.loadStatisticsData();
        
        // 生成日历数据
        this.generateCalendarData();
    },
    
    /**
     * 加载统计数据
     */
    loadStatisticsData() {
        // 从全局数据或缓存加载木鱼和颂钵的统计数据
        const muyuRecords = app.globalData.muyuRecords || wx.getStorageSync('muyuRecords') || {};
        const songboRecords = app.globalData.songboRecords || wx.getStorageSync('songboRecords') || {};
        
        // 获取今天的日期
        const today = this.getTodayDateString();
        
        // 计算木鱼今日次数和总次数
        const muyuTodayCount = muyuRecords[today] || 0;
        let muyuTotal = 0;
        for (const date in muyuRecords) {
            muyuTotal += muyuRecords[date];
        }
        
        // 计算颂钵今日次数和总次数
        const songboTodayCount = songboRecords[today] || 0;
        let songboTotal = 0;
        for (const date in songboRecords) {
            songboTotal += songboRecords[date];
        }
        
        // 计算连续打卡天数
        const muyuStreakDays = this.calculateStreakDays(muyuRecords);
        const songboStreakDays = this.calculateStreakDays(songboRecords);
        
        this.setData({
            muyuTodayCount,
            muyuTotalCount: muyuTotal,
            muyuStreakDays,
            songboTodayCount,
            songboTotalCount: songboTotal,
            songboStreakDays
        });
    },
    
    /**
     * 计算连续打卡天数
     */
    calculateStreakDays(records) {
        if (!records || Object.keys(records).length === 0) {
            return 0;
        }
        
        // 获取所有日期并按降序排序
        const dates = Object.keys(records)
            .filter(date => records[date] > 0)
            .sort((a, b) => new Date(b) - new Date(a));
        
        if (dates.length === 0) {
            return 0;
        }
        
        // 检查最后一次记录是否是今天或昨天
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastRecordDate = new Date(dates[0]);
        lastRecordDate.setHours(0, 0, 0, 0);
        
        // 如果最后一次记录不是今天或昨天，则连续打卡中断
        if (lastRecordDate.getTime() !== today.getTime() && 
            lastRecordDate.getTime() !== yesterday.getTime()) {
            return 0;
        }
        
        // 计算连续天数
        let streakDays = 1;
        for (let i = 1; i < dates.length; i++) {
            const currentDate = new Date(dates[i-1]);
            const prevDate = new Date(dates[i]);
            
            // 计算日期差
            const diffTime = currentDate.getTime() - prevDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // 如果日期差是1天，则是连续的
            if (diffDays === 1) {
                streakDays++;
            } else {
                break;
            }
        }
        
        return streakDays;
    },
    
    /**
     * 生成日历数据（最近两周）
     */
    generateCalendarData() {
        const today = new Date();
        const muyuRecords = app.globalData.muyuRecords || wx.getStorageSync('muyuRecords') || {};
        const songboRecords = app.globalData.songboRecords || wx.getStorageSync('songboRecords') || {};
        
        const calendarDays = [];
        
        // 生成最近14天的数据（包括今天）
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            calendarDays.push({
                date: dateString,
                day: day,
                isToday: i === 0,
                muyuCount: muyuRecords[dateString] || 0,
                songboCount: songboRecords[dateString] || 0
            });
        }
        
        this.setData({
            calendarDays
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
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 页面显示时刷新数据
        this.loadStatisticsData();
        this.generateCalendarData();
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

    }
}) 