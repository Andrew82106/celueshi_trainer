const app = getApp();
const { loadRankingDataByDateRange } = require('../profileshanmen/services/index');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        rankingList: [],           // 当前显示的排名列表
        isRankingLoading: true,    // 排名数据是否正在加载
        isRankingExpanded: false,  // 排名列表是否展开
        displayRankingLimit: 10,   // 默认显示前10名
        currentRankingType: 'day', // 当前排行榜类型：day(日榜)、week(周榜)、month(月榜)、year(年榜)、total(总榜)
        dayRankingList: [],        // 日榜数据
        weekRankingList: [],       // 周榜数据
        monthRankingList: [],      // 月榜数据
        yearRankingList: [],       // 年榜数据
        totalRankingList: [],      // 总榜数据
        onlineUserCount: 0         // 当前在线用户数量
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 加载排行榜数据
        this.loadRankingData();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 页面显示时刷新排行榜数据
        this.loadRankingData();
    },

    /**
     * 导航返回
     */
    navigateBack() {
        wx.navigateBack();
    },

    navigateToUserInfoShanmen(e) {
        const userId = e.currentTarget.dataset.userId;
        const userName = e.currentTarget.dataset.userName;
        console.log(`[用户详情] 跳转到用户详情页，用户ID: ${userId}, 用户名: ${userName}`);
        
        // 这里userId实际上对应的是openId
        wx.navigateTo({
            url: `/pages/userinfoshanmen/userinfoshanmen?userId=${userId}&userName=${userName}`
        });
    },

    /**
     * 加载用户排名数据
     */
    loadRankingData() {
        console.log("[排序调试] 开始加载排名数据");
        // 设置加载状态为true
        this.setData({
            isRankingLoading: true
        });
        
        // 获取当前日期
        const now = new Date();
        
        // 计算日期范围
        const todayDate = this.getTodayDateString(); // 今天，格式：YYYY-MM-DD
        
        // 计算一周前的日期
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        const weekStartDate = this.formatDate(oneWeekAgo); // 一周前，格式：YYYY-MM-DD
        
        // 计算一个月前的日期
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        const monthStartDate = this.formatDate(oneMonthAgo); // 一个月前，格式：YYYY-MM-DD
        
        // 计算一年前的日期
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        const yearStartDate = this.formatDate(oneYearAgo); // 一年前，格式：YYYY-MM-DD
        
        // 计算一个很早的日期作为总榜的开始日期（2000年1月1日）
        const veryEarlyDate = "2000-01-01";
        
        console.log(`[排序调试] 日期范围 - 今日: ${todayDate}, 周开始: ${weekStartDate}, 月开始: ${monthStartDate}, 年开始: ${yearStartDate}, 总榜开始: ${veryEarlyDate}`);
        
        // 获取数据库实例
        const db = app.globalData.db;
        
        // 使用Promise.all同时请求五种不同时间范围的数据
        Promise.all([
            // 日榜 - 今日数据
            loadRankingDataByDateRange(db, todayDate, todayDate),
            // 周榜 - 过去7天数据
            loadRankingDataByDateRange(db, weekStartDate, todayDate),
            // 月榜 - 过去30天数据
            loadRankingDataByDateRange(db, monthStartDate, todayDate),
            // 年榜 - 过去365天数据
            loadRankingDataByDateRange(db, yearStartDate, todayDate),
            // 总榜 - 使用2000年至今的所有数据
            loadRankingDataByDateRange(db, veryEarlyDate, todayDate)
        ]).then(([dayData, weekData, monthData, yearData, totalData]) => {
            console.log(`[排序调试] 获取排名数据成功 - 日榜: ${dayData.length}条, 周榜: ${weekData.length}条, 月榜: ${monthData.length}条, 年榜: ${yearData.length}条, 总榜: ${totalData.length}条`);
            
            // 转换日榜数据格式
            const dayRankingList = dayData.map(item => ({
                ...item,
                todayMinutes: item.rangeMinutes,
                todayCount: item.rangeCount
            }));
            
            // 转换周榜数据格式
            const weekRankingList = weekData.map(item => ({
                ...item,
                weekMinutes: item.rangeMinutes,
                weekCount: item.rangeCount
            }));
            
            // 转换月榜数据格式
            const monthRankingList = monthData.map(item => ({
                ...item,
                monthMinutes: item.rangeMinutes,
                monthCount: item.rangeCount
            }));
            
            // 转换年榜数据格式
            const yearRankingList = yearData.map(item => ({
                ...item,
                yearMinutes: item.rangeMinutes,
                yearCount: item.rangeCount
            }));
            
            // 转换总榜数据格式
            const totalRankingList = totalData.map(item => ({
                ...item,
                totalMinutes: item.rangeMinutes,
                totalCount: item.rangeCount
            }));
            
            // 根据当前选中的榜单类型选择要显示的数据
            let currentList = [];
            console.log("[排序调试] 当前选中榜单类型:", this.data.currentRankingType);
            
            switch(this.data.currentRankingType) {
                case 'day':
                    currentList = [...dayRankingList];
                    break;
                case 'week':
                    currentList = [...weekRankingList];
                    break;
                case 'month':
                    currentList = [...monthRankingList];
                    break;
                case 'year':
                    currentList = [...yearRankingList];
                    break;
                case 'total':
                    currentList = [...totalRankingList];
                    break;
                default:
                    currentList = [...dayRankingList];
            }
            
            // 统计在线用户数量
            let onlineCount = 0;
            currentList.forEach(user => {
                if (user.isOnline) {
                    onlineCount++;
                }
            });
            console.log(`[排序调试] 排行榜中有 ${onlineCount} 个在线用户`);
            
            // 更新数据并设置加载状态为false
            this.setData({ 
                rankingList: currentList,
                dayRankingList,
                weekRankingList,
                monthRankingList,
                yearRankingList,
                totalRankingList,
                isRankingLoading: false,
                onlineUserCount: onlineCount  // 更新在线用户数量
            });
        }).catch(err => {
            console.error("[排序调试] 获取排名数据失败:", err);
            // 出错时也要设置加载状态为false
            this.setData({ 
                isRankingLoading: false 
            });
            
            wx.showToast({
                title: '加载排行榜失败',
                icon: 'none'
            });
        });
    },

    /**
     * 切换排名列表展开状态
     */
    toggleRankingExpand() {
        this.setData({
            isRankingExpanded: !this.data.isRankingExpanded
        });
    },
    
    /**
     * 切换榜单类型
     */
    switchRankingType(e) {
        const type = e.currentTarget.dataset.type;
        if (type === this.data.currentRankingType) return; // 如果点击的是当前选中的类型，不做任何操作
        
        console.log(`[排序调试] 切换榜单类型: ${type}`);
        
        let rankingList = [];
        // 根据类型选择对应的榜单数据
        switch(type) {
            case 'day':
                rankingList = [...this.data.dayRankingList];
                break;
            case 'week':
                rankingList = this.data.weekRankingList;
                break;
            case 'month':
                rankingList = this.data.monthRankingList;
                break;
            case 'year':
                rankingList = this.data.yearRankingList;
                break;
            case 'total':
                rankingList = this.data.totalRankingList;
                break;
        }
        
        // 更新数据
        this.setData({
            currentRankingType: type,
            rankingList
        });
    },

    /**
     * 刷新在线状态
     */
    refreshOnlineStatus() {
        console.log("[在线状态] 手动刷新在线状态");
        
        // 确保自己处于在线状态
        if (app.globalData.userInfo && app.globalData.userInfo.openId) {
            app.updateUserOnlineStatus(app.globalData.userInfo.openId, true);
        }
        
        // 刷新排行榜
        this.loadRankingData();
        
        wx.showToast({
            title: '已刷新在线状态',
            icon: 'success'
        });
    },

    /**
     * 获取今日日期字符串 (YYYY-MM-DD格式)
     */
    getTodayDateString() {
        const today = new Date();
        return this.formatDate(today);
    },

    /**
     * 格式化日期为 YYYY-MM-DD 格式
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        // 下拉刷新
        this.loadRankingData();
        wx.stopPullDownRefresh();
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '禅修排行榜',
            path: '/pages/index/index'
        };
    }
}); 