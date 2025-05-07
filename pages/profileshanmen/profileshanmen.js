const app = getApp();
const { DAYS_OF_WEEK } = require('./constants/index');
const { loadStatisticsData, loadRankingData_, loadRankingDataByDateRange } = require('./services/index');
const { updateUserLevel } = require('./utils/index');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        userInfo: {},           // 用户信息
        muyuTodayCount: 0,      // 今日木鱼敲击次数
        muyuTotalCount: 0,      // 总木鱼敲击次数
        muyuStreakDays: 0,      // 木鱼连续天数
        muyuTodayMinutes: 0,    // 今日木鱼训练时长（分钟）
        muyuTotalMinutes: 0,    // 总木鱼训练时长（分钟）
        songboTodayCount: 0,    // 今日颂钵敲击次数
        songboTotalCount: 0,    // 总颂钵敲击次数
        songboStreakDays: 0,    // 颂钵连续天数
        songboTodayMinutes: 0,  // 今日颂钵训练时长（分钟）
        songboTotalMinutes: 0,  // 总颂钵训练时长（分钟）
        daysOfWeek: DAYS_OF_WEEK,
        calendarDays: [],       // 日历天数数据
        rankingList: [],        // 用户排名列表
        userLevel: '',          // 用户段位
        isRankingLoading: true, // 排名数据是否正在加载
        isRankingExpanded: false, // 排名列表是否展开
        displayRankingLimit: 10, // 默认显示前10名
        currentRankingType: 'day', // 当前排行榜类型：day(日榜)、week(周榜)、month(月榜)、total(总榜)
        dayRankingList: [],     // 日榜数据
        weekRankingList: [],    // 周榜数据
        monthRankingList: [],   // 月榜数据
        totalRankingList: [],   // 总榜数据
        onlineUserCount: 0,     // 当前在线用户数量
        isRankingVisible: false, // 排行榜是否可见
        isDayRankingExpanded: false // 日榜是否展开
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log("in profileshanmen onLoad");
        if (app.globalData.userInfo) {
            // 从数据库获取最新的用户信息
            app.globalData.db.collection("userinfo")
                .where({
                    openId: app.globalData.userInfo.openId
                })
                .get()
                .then(res => {
                    if (res.data && res.data.length > 0) {
                        const userInfo = res.data[0];
                        // 保持原有的openId
                        const originalOpenId = app.globalData.userInfo.openId;
                        // 更新全局用户信息
                        app.globalData.userInfo = {
                            ...userInfo,
                            openId: originalOpenId
                        };
                        // 更新页面数据
                        this.setData({
                            userInfo: app.globalData.userInfo
                        });
                        console.log("用户信息更新成功:", app.globalData.userInfo);
                    }
                })
                .catch(err => {
                    console.error("获取用户信息失败:", err);
                });
        }
        
        this.loadStatisticsData();
        this.generateCalendarData();
        // 不再自动加载排行榜数据
    },
    
    /**
     * 加载统计数据（Promise风格）
     */
    loadStatisticsData() {
        return new Promise((resolve, reject) => {
            const result = require('./services/index').loadStatisticsData();
            result.then(stats => {
                this.setData(stats, resolve);
            }).catch(err => {
                reject(err);
            });
        });
    },
    
    /**
     * 生成日历数据（Promise风格）
     */
    generateCalendarData() {
        return new Promise((resolve, reject) => {
            const today = new Date();
            const calendarDays = [];
            const twoWeeksAgo = new Date(today);
            twoWeeksAgo.setDate(today.getDate() - 13);
            const startDate = `${twoWeeksAgo.getFullYear()}-${String(twoWeeksAgo.getMonth() + 1).padStart(2, '0')}-${String(twoWeeksAgo.getDate()).padStart(2, '0')}`;
            const endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const openId = app.globalData.userInfo.openId;
            app.globalData.db.collection("trainlog")
                .where({ openId: openId, date: { $gte: startDate, $lte: endDate } })
                .get()
                .then(res => {
                    const trainRecords = {};
                    res.data.forEach(record => {
                        trainRecords[record.date] = {
                            muyuCount: record.muyuCounts || 0,
                            songboCount: record.songboCounts || 0,
                            muyuMinutes: Math.ceil((record.muyuSeconds || 0) / 60),
                            songboMinutes: Math.ceil((record.songboSeconds || 0) / 60)
                        };
                    });
                    for (let i = 13; i >= 0; i--) {
                        const currentDate = new Date(today);
                        currentDate.setDate(today.getDate() - i);
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                        calendarDays.push({
                            date: currentDate,
                            dateStr: dateStr,
                            day: currentDate.getDate(),
                            isToday: i === 0,
                            trainData: trainRecords[dateStr] || null
                        });
                    }
                    this.setData({ calendarDays }, resolve);
                })
                .catch(err => {
                    for (let i = 13; i >= 0; i--) {
                        const currentDate = new Date(today);
                        currentDate.setDate(today.getDate() - i);
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                        calendarDays.push({
                            date: currentDate,
                            dateStr: dateStr,
                            day: currentDate.getDate(),
                            isToday: i === 0,
                            trainData: null
                        });
                    }
                    this.setData({ calendarDays }, resolve);
                });
        });
    },
    
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        // 页面首次渲染完成
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 页面显示
        // 更新加速字段和用户训练字段信息
        this.updateAcceleratedFields();
        // 加载统计数据
        this.loadStatisticsData();
        // 生成日历数据（近期记录）
        this.generateCalendarData();
        // 刷新时长排名
        this.loadRankingData();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        // 页面隐藏
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        // 页面卸载
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        // 下拉刷新
        this.loadStatisticsData();
        this.generateCalendarData();
        this.loadRankingData();
        wx.stopPullDownRefresh();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
        // 上拉触底
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
        return {
            title: '知行训练',
            path: '/pages/index/index'
        };
    },

    /**
     * 导航到主页
     */
    navigateToHome() {
        wx.redirectTo({
            url: '/pages/index/index'
        });
    },

    /**
     * 导航到用户信息修改页面
     */
    navigateToUserInfo() {
        wx.redirectTo({
            url: '/pages/login/login'
        });
    },

    navigateToAdmin() {
        wx.navigateTo({
            url: '/packageTrain/pages/admin/admin'
        });
    },

    /**
     * 导航到排行榜页面
     */
    navigateToRanklist() {
        wx.navigateTo({
            url: '/pages/ranklistshanmen/ranklistshanmen'
        });
    },

    navigateToUserInfoShanmen(e) {
        const userId = e.currentTarget.dataset.userId;
        const userName = e.currentTarget.dataset.userName;
        console.log(`[用户详情] 跳转到用户详情页，用户ID: ${userId}, 用户名: ${userName}`);
        
        wx.navigateTo({
            url: `/pages/userinfoshanmen/userinfoshanmen?userId=${userId}&userName=${userName}`
        });
    },

    /**
     * 加载用户排名数据（仅日榜）
     */
    loadRankingData(shouldRender = true) {
        console.log("[排序调试] 开始加载排名数据");
        // 设置加载状态为true
        this.setData({
            isRankingLoading: true
        });
        
        // 获取当前日期
        const todayDate = this.getTodayDateString(); // 今天，格式：YYYY-MM-DD
        
        // 获取数据库实例
        const db = app.globalData.db;
        
        // 只加载日榜数据
        loadRankingDataByDateRange(db, todayDate, todayDate).then((dayData) => {
            console.log(`[排序调试] 获取日榜数据成功: ${dayData.length}条`);
            
            // 转换日榜数据格式
            const dayRankingList = dayData.map(item => ({
                ...item,
                todayMinutes: item.rangeMinutes,
                todayCount: item.rangeCount
            }));
            
            // 确保日榜按照今日时长降序排序
            dayRankingList.sort((a, b) => {
                return b.todayMinutes - a.todayMinutes;
            });
            
            // 过滤掉时长为0且不在线的用户
            const filteredDayRankingList = dayRankingList.filter(user => {
                return user.todayMinutes > 0 || user.isOnline;
            });
            
            console.log(`[排序调试] 过滤后的日榜数据: ${filteredDayRankingList.length}条`);
            
            // 统计在线用户数量
            let onlineCount = 0;
            filteredDayRankingList.forEach(user => {
                if (user.isOnline) {
                    onlineCount++;
                }
            });
            
            // 更新数据并设置加载状态为false
            this.setData({ 
                dayRankingList: filteredDayRankingList,
                isRankingLoading: false,
                onlineUserCount: onlineCount
            });
        }).catch(err => {
            console.error("[排序调试] 获取排名数据失败:", err);
            // 出错时也要设置加载状态为false
            this.setData({ 
                isRankingLoading: false 
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
                // 再次确保日榜按照今日时长排序
                rankingList.sort((a, b) => b.todayMinutes - a.todayMinutes);
                console.log("[排序调试] 切换到日榜，重新排序完成");
                break;
            case 'week':
                rankingList = this.data.weekRankingList;
                break;
            case 'month':
                rankingList = this.data.monthRankingList;
                break;
            case 'total':
                rankingList = this.data.totalRankingList;
                break;
        }
        
        // 输出要显示的排行榜前几名
        if (rankingList.length > 0) {
            console.log("[排序调试] 切换后的排行榜TOP3:", rankingList.slice(0, 3).map(item => ({
                nickName: item.nickName,
                minutes: type === 'day' ? item.todayMinutes : 
                         type === 'week' ? item.weekMinutes :
                         type === 'month' ? item.monthMinutes : item.totalMinutes
            })));
        }
        
        // 更新数据
        this.setData({
            currentRankingType: type,
            rankingList
        });
    },

    /**
     * 计算用户段位
     */
    calculateUserLevel(totalMinutes) {
        // 使用utils中的函数计算段位，确保与系统其他部分保持一致
        const { calculateUserLevel } = require('./utils/index');
        console.log(`[计算用户段位] 总时长: ${totalMinutes}`);
        return calculateUserLevel(totalMinutes);
    },

    /**
     * 处理本地数据并生成排行榜
     */
    processLocalData(userStatsMap, usersMap, currentUserOpenId, today, db) {
        // 检查并更新当前用户的本地今日数据
        if (currentUserOpenId && userStatsMap[currentUserOpenId]) {
            // 获取本地记录
            const muyuRecords = wx.getStorageSync('muyuRecords') || {};
            const songboRecords = wx.getStorageSync('songboRecords') || {};
            const localMuyuTodayCount = muyuRecords[today] || 0;
            const localSongboTodayCount = songboRecords[today] || 0;
            
            console.log(`本地今日记录 - 木鱼:${localMuyuTodayCount}, 颂钵:${localSongboTodayCount}`);
            console.log(`远端今日记录 - 木鱼:${userStatsMap[currentUserOpenId].muyuTodayCount}, 颂钵:${userStatsMap[currentUserOpenId].songboTodayCount}`);
            
            // 比较本地和远端数据，取最大值
            if (localMuyuTodayCount > userStatsMap[currentUserOpenId].muyuTodayCount) {
                userStatsMap[currentUserOpenId].muyuTodayCount = localMuyuTodayCount;
            }
            
            if (localSongboTodayCount > userStatsMap[currentUserOpenId].songboTodayCount) {
                userStatsMap[currentUserOpenId].songboTodayCount = localSongboTodayCount;
            }
            
            // 从全局变量中获取当日训练时长（分钟）
            const globalMuyuTodayMinutes = app.globalData.muyuTodayMinutes || 0;
            const globalSongboTodayMinutes = app.globalData.songboTodayMinutes || 0;
            
            // 将分钟转换为秒（先检查全局数据是否存在）
            const globalMuyuTodaySeconds = globalMuyuTodayMinutes > 0 ? globalMuyuTodayMinutes * 60 : 0;
            const globalSongboTodaySeconds = globalSongboTodayMinutes > 0 ? globalSongboTodayMinutes * 60 : 0;
            
            console.log(`全局今日训练时长 - 木鱼:${globalMuyuTodayMinutes}分钟, 颂钵:${globalSongboTodayMinutes}分钟`);
            console.log(`远端今日训练时长 - 木鱼:${Math.ceil(userStatsMap[currentUserOpenId].muyuTodaySeconds / 60)}分钟, 颂钵:${Math.ceil(userStatsMap[currentUserOpenId].songboTodaySeconds / 60)}分钟`);
            
            // 比较全局变量和远端的训练时长，取最大值
            if (globalMuyuTodaySeconds > userStatsMap[currentUserOpenId].muyuTodaySeconds) {
                console.log(`更新木鱼时长: ${userStatsMap[currentUserOpenId].muyuTodaySeconds} -> ${globalMuyuTodaySeconds}`);
                userStatsMap[currentUserOpenId].muyuTodaySeconds = globalMuyuTodaySeconds;
                
                // 同时更新数据库中的记录
                db.collection("trainlog").where({
                    openId: currentUserOpenId,
                    date: today
                }).get().then(res => {
                    if (res.data && res.data.length > 0) {
                        // 有今日记录，更新
                        db.collection("trainlog").doc(res.data[0]._id).update({
                            data: {
                                muyuSeconds: globalMuyuTodaySeconds
                            }
                        }).then(() => {
                            console.log("更新木鱼时长到数据库成功");
                        }).catch(err => {
                            console.error("更新木鱼时长到数据库失败:", err);
                        });
                    }
                }).catch(err => {
                    console.error("查询今日记录失败:", err);
                });
            }
            
            if (globalSongboTodaySeconds > userStatsMap[currentUserOpenId].songboTodaySeconds) {
                console.log(`更新颂钵时长: ${userStatsMap[currentUserOpenId].songboTodaySeconds} -> ${globalSongboTodaySeconds}`);
                userStatsMap[currentUserOpenId].songboTodaySeconds = globalSongboTodaySeconds;
                
                // 同时更新数据库中的记录
                db.collection("trainlog").where({
                    openId: currentUserOpenId,
                    date: today
                }).get().then(res => {
                    if (res.data && res.data.length > 0) {
                        // 有今日记录，更新
                        db.collection("trainlog").doc(res.data[0]._id).update({
                            data: {
                                songboSeconds: globalSongboTodaySeconds
                            }
                        }).then(() => {
                            console.log("更新颂钵时长到数据库成功");
                        }).catch(err => {
                            console.error("更新颂钵时长到数据库失败:", err);
                        });
                    }
                }).catch(err => {
                    console.error("查询今日记录失败:", err);
                });
            }
        }
        
        // 整合用户信息和统计数据，并转换为数组
        const rankingData = Object.keys(userStatsMap).map(openId => {
            const stats = userStatsMap[openId];
            const user = usersMap[openId] || { nickName: '禅修者', avatarUrl: '' };
            
            // 计算总次数和总时长（分钟）
            const totalCount = stats.muyuTotalCount + stats.songboTotalCount;
            const totalSeconds = stats.muyuTotalSeconds + stats.songboTotalSeconds;
            const totalMinutes = Math.ceil(totalSeconds / 60);
            
            // 计算今日次数和今日时长（分钟）
            const todayCount = stats.muyuTodayCount + stats.songboTodayCount;
            const todaySeconds = stats.muyuTodaySeconds + stats.songboTodaySeconds;
            const todayMinutes = Math.ceil(todaySeconds / 60);
            
            // 计算用户段位
            const userLevel = this.calculateUserLevel(totalMinutes);
            
            console.log(`[更新累积数据] 计算出的段位: ${userLevel}`);
            
            return {
                openId,
                nickName: user.nickName,
                avatarUrl: user.avatarUrl,
                muyuTotalCount: stats.muyuTotalCount,
                songboTotalCount: stats.songboTotalCount,
                muyuTodayCount: stats.muyuTodayCount,
                songboTodayCount: stats.songboTodayCount,
                muyuTotalSeconds: stats.muyuTotalSeconds,
                songboTotalSeconds: stats.songboTotalSeconds,
                muyuTodaySeconds: stats.muyuTodaySeconds,
                songboTodaySeconds: stats.songboTodaySeconds,
                totalCount,
                todayCount,
                totalMinutes,
                todayMinutes,
                userLevel,
                isCurrentUser: openId === currentUserOpenId
            };
        });
        
        // 如果当前用户存在，更新当前用户的段位
        if (currentUserOpenId && rankingData.find(user => user.openId === currentUserOpenId)) {
            const currentUser = rankingData.find(user => user.openId === currentUserOpenId);
            this.setData({
                userLevel: currentUser.userLevel
            });
        }
        
        // 按今日时长排序（降序），若今日时长相同则按总时长排序
        rankingData.sort((a, b) => {
            if (b.todayMinutes !== a.todayMinutes) {
                return b.todayMinutes - a.todayMinutes;
            }
            // 如果今日时长相同，直接按总时长排序
            return b.totalMinutes - a.totalMinutes;
        });
        
        return { rankingData };
    },

    /**
     * 获取今日日期字符串 (YYYY-MM-DD格式)
     */
    getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 更新用户加速字段
     */
    updateAcceleratedFields() {
        console.log("[更新加速字段] 开始更新用户训练数据");
        const db = app.globalData.db;
        const openId = app.globalData.userInfo.openId;
        
        if (!openId) {
            console.error("[更新加速字段] 未获取到用户openId");
            return;
        }
        
        console.log(`[更新加速字段] 用户openId: ${openId}`);
        
        // 获取用户信息
        db.collection("userinfo").where({
            openId: openId
        }).get().then(userRes => {
            console.log("[更新加速字段] 用户信息查询结果:", userRes);
            
            if (userRes.data && userRes.data.length > 0) {
                const userInfo = userRes.data[0];
                const userId = userInfo._id;
                console.log(`[更新加速字段] 找到用户信息, userId: ${userId}`);
                
                // 获取用户的所有训练记录
                db.collection("trainlog").where({
                    openId: openId
                }).get().then(recordsRes => {
                    console.log(`[更新加速字段] 获取到${recordsRes.data.length}条训练记录`);
                    
                    // 完全重新计算累积数据
                    let totalMuyuCount = 0;
                    let totalSongboCount = 0;
                    let totalMuyuSeconds = 0;
                    let totalSongboSeconds = 0;
                    
                    if (recordsRes.data && recordsRes.data.length > 0) {
                        console.log(`[更新加速字段] 开始计算用户${openId}的累积数据`);
                        recordsRes.data.forEach((record, index) => {
                            const muyuCounts = record.muyuCounts || 0;
                            const songboCounts = record.songboCounts || 0;
                            const muyuSeconds = record.muyuSeconds || 0;
                            const songboSeconds = record.songboSeconds || 0;
                            
                            totalMuyuCount += muyuCounts;
                            totalSongboCount += songboCounts;
                            totalMuyuSeconds += muyuSeconds;
                            totalSongboSeconds += songboSeconds;
                            
                            // 只打印前5条记录的详细信息
                            if (index < 5) {
                                console.log(`[更新加速字段] 记录[${index}]: 木鱼=${muyuCounts}次/${muyuSeconds}秒, 颂钵=${songboCounts}次/${songboSeconds}秒`);
                            }
                            if (index === 5 && recordsRes.data.length > 10) {
                                console.log(`[更新加速字段] ...省略${recordsRes.data.length - 10}条记录...`);
                            }
                        });
                        
                        console.log(`[更新加速字段] 用户${openId}累积数据统计结果:`, {
                            totalMuyuCount,
                            totalSongboCount,
                            totalMuyuSeconds,
                            totalSongboSeconds
                        });
                    } else {
                        console.log(`[更新加速字段] 用户${openId}没有找到任何训练记录`);
                    }
                    
                    // 计算用户段位
                    const totalSeconds = totalMuyuSeconds + totalSongboSeconds;
                    const totalMinutes = Math.ceil(totalSeconds / 60);
                    
                    // 调试输出段位计算相关信息
                    const { calculateUserLevel } = require('./utils/index');
                    const { USER_LEVELS, LEVEL_REQUIREMENTS } = require('./constants/index');
                    console.log('[更新加速字段] 段位计算相关信息:', {
                        USER_LEVELS,
                        LEVEL_REQUIREMENTS,
                        totalMinutes
                    });
                    
                    // 计算段位
                    const userLevel = calculateUserLevel(totalMinutes);
                    console.log(`[更新加速字段] 计算出的段位: ${userLevel}`);
                    
                    // 更新用户数据
                    const now = new Date();
                    const formattedDate = now.toISOString();
                    
                    console.log(`[更新加速字段] 开始更新用户数据到数据库, userId: ${userId}`);
                    console.log(`[更新加速字段] 数据对比:`, {
                        更新前: {
                            accumulateMuyu: userInfo.accumulateMuyu || 0,
                            accumulateMuyuTime: userInfo.accumulateMuyuTime || 0,
                            accumulateSongbo: userInfo.accumulateSongbo || 0,
                            accumulateSongboTime: userInfo.accumulateSongboTime || 0,
                            level: userInfo.level || '未定段'
                        },
                        更新后: {
                            accumulateMuyu: totalMuyuCount,
                            accumulateMuyuTime: totalMuyuSeconds,
                            accumulateSongbo: totalSongboCount,
                            accumulateSongboTime: totalSongboSeconds,
                            level: userLevel
                        }
                    });
                    
                    db.collection('userinfo').doc(userId).update({
                        data: {
                            accumulateMuyu: totalMuyuCount,
                            accumulateMuyuTime: totalMuyuSeconds,
                            accumulateSongbo: totalSongboCount,
                            accumulateSongboTime: totalSongboSeconds,
                            level: userLevel,
                            lastUpdateTime: formattedDate
                        }
                    }).then((updateRes) => {
                        console.log("[更新加速字段] 更新用户累积数据和段位成功:", updateRes);
                    }).catch(err => {
                        console.error('[更新加速字段] 更新用户累积数据失败:', err);
                    });
                }).catch(err => {
                    console.error('[更新加速字段] 获取用户训练记录失败:', err);
                });
            } else {
                console.error('[更新加速字段] 未找到用户信息');
            }
        }).catch(err => {
            console.error('[更新加速字段] 获取用户信息失败:', err);
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
     * 切换排行榜显示状态
     */
    toggleRankingVisibility() {
        const willBeVisible = !this.data.isRankingVisible;
        console.log("[排序调试] 切换排行榜显示状态:", willBeVisible ? "显示" : "隐藏");
        
        if (willBeVisible) {
            // 如果要显示排行榜，刷新数据
            this.loadRankingData(true);
        } else {
            // 如果要隐藏排行榜，直接设置状态
            this.setData({
                isRankingVisible: false
            });
        }
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
     * 刷新所有数据
     */
    refreshAllData() {
        console.log("===== [刷新数据] 开始刷新所有数据 =====");
        wx.showLoading({
            title: '正在刷新...',
        });
        // 更新用户的累积数据和段位
        console.log("[刷新数据] 开始调用updateUserAccumulateData()");
        this.updateUserAccumulateData().then(() => {
            console.log("[刷新数据] updateUserAccumulateData成功完成");
            Promise.all([
                this.loadStatisticsData(),
                this.generateCalendarData(),
                this.loadRankingData()
            ]).then(() => {
                console.log("[刷新数据] 所有数据刷新完成");
                wx.hideLoading();
                wx.showToast({
                    title: '数据已刷新',
                    icon: 'success',
                    duration: 1500
                });
            }).catch(err => {
                console.error("[刷新数据] 刷新数据过程中出错:", err);
                wx.hideLoading();
                wx.showToast({
                    title: '刷新失败',
                    icon: 'none',
                    duration: 1500
                });
            });
        }).catch(err => {
            console.error("[刷新数据] 更新用户累积数据失败:", err);
            wx.hideLoading();
            wx.showToast({
                title: '更新失败',
                icon: 'none',
                duration: 1500
            });
        });
    },
    
    /**
     * 更新用户的累积数据
     */
    updateUserAccumulateData() {
        console.log("===== [更新累积数据] 开始更新用户累积数据 =====");
        return new Promise((resolve, reject) => {
            if (!app.globalData.userInfo || !app.globalData.userInfo.openId) {
                console.error("[更新累积数据] 用户未登录，无法更新累积数据");
                reject(new Error("用户未登录"));
                return;
            }
            
            const db = app.globalData.db;
            const openId = app.globalData.userInfo.openId;
            console.log(`[更新累积数据] 当前用户openId: ${openId}`);
            
            // 获取用户信息
            console.log("[更新累积数据] 开始查询用户信息");
            db.collection("userinfo").where({
                openId: openId
            }).get().then(userRes => {
                console.log("[更新累积数据] 用户信息查询结果:", userRes);
                
                if (userRes.data && userRes.data.length > 0) {
                    const userInfo = userRes.data[0];
                    const userId = userInfo._id;
                    console.log(`[更新累积数据] 找到用户信息, userId: ${userId}`);
                    
                    // 获取所有训练记录
                    console.log("[更新累积数据] 开始获取所有训练记录");
                    this.getAllTrainingRecords(db, { openId: openId }).then(records => {
                        console.log(`[更新累积数据] 获取到${records.length}条训练记录`);
                        
                        // 完全重新计算累积数据
                        let totalMuyuCount = 0;
                        let totalSongboCount = 0;
                        let totalMuyuSeconds = 0;
                        let totalSongboSeconds = 0;
                        
                        if (records && records.length > 0) {
                            console.log(`[更新累积数据] 用户${openId}找到${records.length}条训练记录，开始计算总和`);
                            records.forEach((record, index) => {
                                const muyuCounts = record.muyuCounts || 0;
                                const songboCounts = record.songboCounts || 0;
                                const muyuSeconds = record.muyuSeconds || 0;
                                const songboSeconds = record.songboSeconds || 0;
                                
                                totalMuyuCount += muyuCounts;
                                totalSongboCount += songboCounts;
                                totalMuyuSeconds += muyuSeconds;
                                totalSongboSeconds += songboSeconds;
                                
                                if (index < 5 || index === records.length - 1) {
                                    console.log(`[更新累积数据] 记录[${index}]: 木鱼=${muyuCounts}次/${muyuSeconds}秒, 颂钵=${songboCounts}次/${songboSeconds}秒`);
                                }
                                if (index === 5 && records.length > 10) {
                                    console.log(`[更新累积数据] ...省略${records.length - 10}条记录...`);
                                }
                            });
                            
                            console.log(`[更新累积数据] 用户${openId}累积数据统计结果:`, {
                                totalMuyuCount,
                                totalSongboCount,
                                totalMuyuSeconds,
                                totalSongboSeconds
                            });
                        } else {
                            console.log(`[更新累积数据] 用户${openId}没有找到任何训练记录`);
                        }
                        
                        // 计算用户段位
                        const totalSeconds = totalMuyuSeconds + totalSongboSeconds;
                        const totalMinutes = Math.ceil(totalSeconds / 60);
                        
                        // 调试输出
                        const { calculateUserLevel } = require('./utils/index');
                        const { USER_LEVELS, LEVEL_REQUIREMENTS } = require('./constants/index');
                        console.log('[调试] USER_LEVELS:', USER_LEVELS);
                        console.log('[调试] LEVEL_REQUIREMENTS:', LEVEL_REQUIREMENTS);
                        console.log(`[调试] totalMinutes: ${totalMinutes}`);
                        Object.keys(USER_LEVELS).forEach(key => {
                            const name = USER_LEVELS[key];
                            const min = LEVEL_REQUIREMENTS[name];
                            console.log(`[调试] ${name} 段位要求: ${min} 分钟`);
                        });
                        
                        // 计算段位
                        const userLevel = calculateUserLevel(totalMinutes);
                        console.log(`[调试] 计算出的段位: ${userLevel}`);
                        
                        // 更新用户数据
                        const now = new Date();
                        const formattedDate = now.toISOString();
                        
                        console.log(`[更新累积数据] 开始更新用户数据到数据库, userId: ${userId}`);
                        console.log(`[更新累积数据] 数据对比:`, {
                            更新前: {
                                accumulateMuyu: userInfo.accumulateMuyu || 0,
                                accumulateMuyuTime: userInfo.accumulateMuyuTime || 0,
                                accumulateSongbo: userInfo.accumulateSongbo || 0,
                                accumulateSongboTime: userInfo.accumulateSongboTime || 0,
                                level: userInfo.level || '未定段'
                            },
                            更新后: {
                                accumulateMuyu: totalMuyuCount,
                                accumulateMuyuTime: totalMuyuSeconds,
                                accumulateSongbo: totalSongboCount,
                                accumulateSongboTime: totalSongboSeconds,
                                level: userLevel
                            }
                        });
                        
                        db.collection('userinfo').doc(userId).update({
                            data: {
                                accumulateMuyu: totalMuyuCount,
                                accumulateMuyuTime: totalMuyuSeconds,
                                accumulateSongbo: totalSongboCount,
                                accumulateSongboTime: totalSongboSeconds,
                                level: userLevel,
                                lastUpdateTime: formattedDate
                            }
                        }).then((updateRes) => {
                            console.log("[更新累积数据] 更新用户累积数据和段位成功:", updateRes);
                            resolve();
                        }).catch(err => {
                            console.error('[更新累积数据] 更新用户累积数据失败:', err);
                            reject(err);
                        });
                    }).catch(err => {
                        console.error('[更新累积数据] 获取用户训练记录失败:', err);
                        reject(err);
                    });
                } else {
                    console.error('[更新累积数据] 未找到用户信息');
                    reject(new Error("未找到用户信息"));
                }
            }).catch(err => {
                console.error('[更新累积数据] 获取用户信息失败:', err);
                reject(err);
            });
        });
    },
    
    /**
     * 分页获取所有训练记录
     */
    getAllTrainingRecords: async function(db, query) {
        console.log(`===== [获取训练记录] 开始获取训练记录 =====`);
        console.log(`[获取训练记录] 查询条件:`, query);
        
        const MAX_LIMIT = 20; // 微信云开发单次查询最大20条记录
        let records = [];
        
        try {
            // 先获取总数
            console.log(`[获取训练记录] 开始查询记录总数`);
            const countResult = await db.collection('trainlog').where(query).count();
            const total = countResult.total;
            console.log(`[获取训练记录] 该用户训练记录总数：${total}`);
            
            // 如果没有记录，直接返回空数组
            if (total === 0) {
                console.log(`[获取训练记录] 用户没有训练记录，返回空数组`);
                return [];
            }
            
            // 计算需要分几次获取
            const batchTimes = Math.ceil(total / MAX_LIMIT);
            console.log(`[获取训练记录] 需要分${batchTimes}次获取训练记录`);
            
            // 分批次获取数据
            const tasks = [];
            for (let i = 0; i < batchTimes; i++) {
                console.log(`[获取训练记录] 创建第${i+1}批查询任务, skip=${i * MAX_LIMIT}, limit=${MAX_LIMIT}`);
                const promise = db.collection('trainlog')
                    .where(query)
                    .skip(i * MAX_LIMIT)
                    .limit(MAX_LIMIT)
                    .get();
                tasks.push(promise);
            }
            
            // 等待所有请求完成
            console.log(`[获取训练记录] 开始并行执行${tasks.length}个查询任务`);
            const results = await Promise.all(tasks);
            console.log(`[获取训练记录] 所有查询任务完成, 获取到${results.length}批数据`);
            
            // 合并结果
            results.forEach((res, index) => {
                console.log(`[获取训练记录] 第${index+1}批数据包含${res.data.length}条记录`);
                records = records.concat(res.data);
            });
            
            console.log(`[获取训练记录] 成功获取该用户的全部${records.length}条训练记录`);
            return records;
        } catch (err) {
            console.error(`[获取训练记录] 获取训练记录失败:`, err);
            return [];
        }
    },

    /**
     * 切换日榜展开/收起状态
     */
    toggleDayRankingExpand() {
        this.setData({
            isDayRankingExpanded: !this.data.isDayRankingExpanded
        });
    }
}) 