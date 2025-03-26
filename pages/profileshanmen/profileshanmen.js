const app = getApp();
const { DAYS_OF_WEEK } = require('./constants/index');
const { loadStatisticsData, loadRankingData_ } = require('./services/index');

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
        displayRankingLimit: 10  // 默认显示前10名
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
        this.loadRankingData();
    },
    
    /**
     * 加载统计数据
     */
    loadStatisticsData() {
        loadStatisticsData().then(stats => {
            this.setData(stats);
        });
    },
    
    /**
     * 生成日历数据（最近两周）
     */
    generateCalendarData() {
        const today = new Date();
        const calendarDays = [];
        
        // 计算两周前的日期
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 13); // 13天前（加上今天共14天）
        
        // 获取日期范围的字符串
        const startDate = `${twoWeeksAgo.getFullYear()}-${String(twoWeeksAgo.getMonth() + 1).padStart(2, '0')}-${String(twoWeeksAgo.getDate()).padStart(2, '0')}`;
        const endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // 从数据库获取最近两周的训练记录
        const openId = app.globalData.userInfo.openId;
        app.globalData.db.collection("trainlog")
            .where({
                openId: openId,
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
            .get()
            .then(res => {
                const trainRecords = {};
                // 将训练记录转换为以日期为键的对象
                res.data.forEach(record => {
                    trainRecords[record.date] = {
                        muyuCount: record.muyuCounts || 0,
                        songboCount: record.songboCounts || 0,
                        muyuMinutes: Math.ceil((record.muyuSeconds || 0) / 60),
                        songboMinutes: Math.ceil((record.songboSeconds || 0) / 60)
                    };
                });
                
                // 生成最近14天的数据（包括今天）
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
                
                this.setData({ calendarDays });
            })
            .catch(err => {
                console.error("获取训练记录失败:", err);
                // 如果获取失败，仍然显示日历，但没有训练数据
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
                this.setData({ calendarDays });
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
            title: '山门知行',
            path: '/pages/index/index'
        };
    },

    /**
     * 导航到主页
     */
    navigateToHome() {
        wx.switchTab({
            url: '/pages/index/index'
        });
    },

    /**
     * 导航到用户信息修改页面
     */
    navigateToUserInfo() {
        wx.navigateTo({
            url: '/pages/userinfo/userinfo'
        });
    },

    navigateToAdmin() {
        wx.navigateTo({
            url: '/pages/admin/admin'
        });
    },

    /**
     * 加载用户排名数据
     */
    loadRankingData() {
        console.log("开始加载排名数据");
        // 设置加载状态为true
        this.setData({
            isRankingLoading: true
        });
        
        loadRankingData_().then(rankingList => {
            console.log(`获取排名数据成功，共 ${rankingList.length} 条记录`);
            // 检查排名数据的字段
            if (rankingList.length > 0) {
                console.log("排名第一数据示例:", {
                    nickName: rankingList[0].nickName,
                    todayMinutes: rankingList[0].todayMinutes,
                    totalMinutes: rankingList[0].totalMinutes,
                    userLevel: rankingList[0].userLevel
                });
            }
            
            // 更新数据并设置加载状态为false
            this.setData({ 
                rankingList,
                isRankingLoading: false 
            });
        }).catch(err => {
            console.error("获取排名数据失败:", err);
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
     * 计算用户段位
     */
    calculateUserLevel(totalMinutes) {
        if (totalMinutes >= 1500) {
            return "山门9段";
        } else if (totalMinutes >= 1200) {
            return "山门8段";
        } else if (totalMinutes >= 900) {
            return "山门7段";
        } else if (totalMinutes >= 600) {
            return "山门6段";
        } else if (totalMinutes >= 300) {
            return "山门5段";
        } else if (totalMinutes >= 200) {
            return "山门4段";
        } else if (totalMinutes >= 120) {
            return "山门3段";
        } else if (totalMinutes >= 60) {
            return "山门2段";
        } else if (totalMinutes >= 10) {
            return "山门1段";
        } else {
            return "初入山门";
        }
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
            // const userLevel = this.calculateUserLevel(totalMinutes);
            // 用constants中的常量来计算用户段位
            const userLevel = stats.userLevel;
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
        if (!app.globalData.userInfo || !app.globalData.userInfo.openId) {
            console.log("用户未登录，无法更新加速字段");
            return;
        }

        const db = app.globalData.db;
        const openId = app.globalData.userInfo.openId;
        const today = this.getTodayDateString();

        // 先查询userinfo表，获取上次更新时间
        db.collection("userinfo").where({
            openId: openId
        }).get().then(userRes => {
            if (userRes.data && userRes.data.length > 0) {
                const userInfo = userRes.data[0];
                const lastUpdateTime = userInfo.lastUpdateTime || 0;
                
                // 获取今日零点的时间戳
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayStartTimestamp = todayStart.getTime();
                
                // 如果上次更新时间在今天之前，则需要更新加速字段
                if (lastUpdateTime < todayStartTimestamp) {
                    console.log("上次更新时间早于今天，需要更新加速字段");
                    
                    // 获取用户今日的训练记录
                    db.collection("trainlog").where({
                        openId: openId,
                        date: today
                    }).get().then(res => {
                        if (res.data && res.data.length > 0) {
                            const record = res.data[0];
                            const muyuCounts = record.muyuCounts || 0;
                            const songboCounts = record.songboCounts || 0;
                            const muyuSeconds = record.muyuSeconds || 0;
                            const songboSeconds = record.songboSeconds || 0;
                            
                            // 更新userinfo表中的加速字段
                            const _ = db.command;
                            db.collection("userinfo").where({
                                openId: openId
                            }).update({
                                data: {
                                    accumulateMuyu: _.inc(muyuCounts),
                                    accumulateMuyuTime: _.inc(muyuSeconds),
                                    accumulateSongbo: _.inc(songboCounts),
                                    accumulateSongboTime: _.inc(songboSeconds),
                                    lastUpdateTime: new Date().getTime()
                                }
                            }).then(res => {
                                console.log("更新用户加速字段成功:", res);
                                // 更新完成后重新加载数据，确保界面显示最新数据
                                this.loadStatisticsData();
                                this.loadRankingData();
                            }).catch(err => {
                                console.error("更新用户加速字段失败:", err);
                            });
                        } else {
                            console.log("今日没有训练记录，不需要更新加速字段");
                            // 仍然更新lastUpdateTime，避免重复检查
                            db.collection("userinfo").where({
                                openId: openId
                            }).update({
                                data: {
                                    lastUpdateTime: new Date().getTime()
                                }
                            });
                        }
                    }).catch(err => {
                        console.error("获取今日训练记录失败:", err);
                    });
                } else {
                    console.log("今日已更新过加速字段，无需重复更新");
                }
            }
        }).catch(err => {
            console.error("获取用户信息失败:", err);
        });
    }
}) 