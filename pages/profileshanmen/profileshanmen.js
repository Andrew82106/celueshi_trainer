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
        muyuTodayMinutes: 0,    // 今日木鱼训练时长（分钟）
        muyuTotalMinutes: 0,    // 总木鱼训练时长（分钟）
        songboTodayCount: 0,    // 今日颂钵敲击次数
        songboTotalCount: 0,    // 总颂钵敲击次数
        songboStreakDays: 0,    // 颂钵连续天数
        songboTodayMinutes: 0,  // 今日颂钵训练时长（分钟）
        songboTotalMinutes: 0,  // 总颂钵训练时长（分钟）
        daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],  // 星期标签
        calendarDays: [],       // 日历天数数据
        rankingList: [],        // 用户排名列表
        userLevel: '',          // 用户段位
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log("in profileshanmen onLoad")
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
        
        // 加载排名数据
        this.loadRankingData();
    },
    
    /**
     * 加载统计数据
     */
    loadStatisticsData() {
        // 获取今天的日期
        const today = this.getTodayDateString();
        const openId = app.globalData.userInfo.openId;
        
        console.log("加载统计数据 - 日期:", today);
        console.log("加载统计数据 - 用户ID:", openId);
        
        // 先获取用户基本信息
        app.globalData.db.collection("userinfo").where({
            openId: openId
        }).get().then(userRes => {
            if (userRes.data && userRes.data.length > 0) {
                console.log("获取用户信息成功:", userRes.data[0]);
                // 更新全局用户信息(但保留原有openId)
                const originalOpenId = app.globalData.userInfo.openId;
                app.globalData.userInfo = {...userRes.data[0], openId: originalOpenId};
            }
            
            // 获取所有训练记录
            return app.globalData.db.collection("trainlog").where({
                openId: openId
            }).get();
        }).then(trainRes => {
            if (trainRes.data && trainRes.data.length > 0) {
                console.log("获取训练记录成功, 共" + trainRes.data.length + "条记录");
                
                // 初始化记录
                let muyuRecords = {};
                let songboRecords = {};
                let muyuTodayCount = 0;
                let songboTodayCount = 0;
                let muyuTotalCount = 0;
                let songboTotalCount = 0;
                let muyuTodaySeconds = 0;
                let songboTodaySeconds = 0;
                let muyuTotalSeconds = 0;
                let songboTotalSeconds = 0;
                
                // 处理每条训练记录
                trainRes.data.forEach(record => {
                    if (!record) return; // 跳过无效记录
                    
                    // 累计总敲击次数
                    muyuTotalCount += (record.muyuCounts || 0);
                    songboTotalCount += (record.songboCounts || 0);
                    
                    // 累计总训练时长（秒）
                    muyuTotalSeconds += (record.muyuSeconds || 0);
                    songboTotalSeconds += (record.songboSeconds || 0);
                    
                    // 记录每日敲击次数
                    if (record.date && record.muyuCounts && record.muyuCounts > 0) {
                        muyuRecords[record.date] = record.muyuCounts;
                    }
                    
                    if (record.date && record.songboCounts && record.songboCounts > 0) {
                        songboRecords[record.date] = record.songboCounts;
                    }
                    
                    // 记录今日敲击次数和训练时长
                    if (record.date === today) {
                        muyuTodayCount = record.muyuCounts || 0;
                        songboTodayCount = record.songboCounts || 0;
                        muyuTodaySeconds = record.muyuSeconds || 0;
                        songboTodaySeconds = record.songboSeconds || 0;
                    }
                });
                
                console.log("木鱼记录:", muyuRecords);
                console.log("颂钵记录:", songboRecords);
                
                // 计算连续打卡天数
                const muyuStreakDays = this.calculateStreakDays(muyuRecords || {});
                const songboStreakDays = this.calculateStreakDays(songboRecords || {});
                
                // 将秒数转换为分钟数（向上取整）
                const muyuTodayMinutes = Math.ceil(muyuTodaySeconds / 60);
                const songboTodayMinutes = Math.ceil(songboTodaySeconds / 60);
                const muyuTotalMinutes = Math.ceil(muyuTotalSeconds / 60);
                const songboTotalMinutes = Math.ceil(songboTotalSeconds / 60);
                
                // 计算用户段位
                const userLevel = this.calculateUserLevel(muyuTotalMinutes + songboTotalMinutes);
                app.globalData.userInfo.userLevel = userLevel;
                
                // 更新全局数据
                app.globalData.muyuRecords = muyuRecords;
                app.globalData.songboRecords = songboRecords;
                app.globalData.muyuTodayCount = muyuTodayCount;
                app.globalData.songboTodayCount = songboTodayCount;
                app.globalData.muyuTotalCount = muyuTotalCount;
                app.globalData.songboTotalCount = songboTotalCount;
                app.globalData.muyuTodayMinutes = muyuTodayMinutes;
                app.globalData.songboTodayMinutes = songboTodayMinutes;
                app.globalData.muyuTotalMinutes = muyuTotalMinutes;
                app.globalData.songboTotalMinutes = songboTotalMinutes;
                
                // 同时更新到用户信息中
                app.globalData.userInfo.muyuTodayCount = muyuTodayCount;
                app.globalData.userInfo.songboTodayCount = songboTodayCount;
                app.globalData.userInfo.muyuTotalCount = muyuTotalCount;
                app.globalData.userInfo.songboTotalCount = songboTotalCount;
                app.globalData.userInfo.muyuRecords = muyuRecords;
                app.globalData.userInfo.songboRecords = songboRecords;
                app.globalData.userInfo.muyuTodayMinutes = muyuTodayMinutes;
                app.globalData.userInfo.songboTodayMinutes = songboTodayMinutes;
                app.globalData.userInfo.muyuTotalMinutes = muyuTotalMinutes;
                app.globalData.userInfo.songboTotalMinutes = songboTotalMinutes;
                app.globalData.userInfo.userLevel = userLevel;
                
                // 更新页面数据
                this.setData({
                    muyuTodayCount,
                    muyuTotalCount,
                    muyuStreakDays,
                    songboTodayCount,
                    songboTotalCount,
                    songboStreakDays,
                    muyuTodayMinutes,
                    muyuTotalMinutes,
                    songboTodayMinutes,
                    songboTotalMinutes,
                    userLevel
                });
                
                console.log("统计数据加载完成", {
                    muyuTodayCount,
                    muyuTotalCount,
                    muyuStreakDays,
                    songboTodayCount, 
                    songboTotalCount,
                    songboStreakDays,
                    muyuTodayMinutes,
                    muyuTotalMinutes,
                    songboTodayMinutes,
                    songboTotalMinutes,
                    userLevel
                });
            } else {
                console.log("未找到训练记录，初始化为0");
                // 没有找到记录，设置为0
                this.setData({
                    muyuTodayCount: 0,
                    muyuTotalCount: 0,
                    muyuStreakDays: 0,
                    songboTodayCount: 0,
                    songboTotalCount: 0,
                    songboStreakDays: 0,
                    muyuTodayMinutes: 0,
                    muyuTotalMinutes: 0,
                    songboTodayMinutes: 0,
                    songboTotalMinutes: 0,
                    userLevel: '初入山门'
                });
            }
        }).catch(err => {
            console.error("获取统计数据失败:", err);
            wx.showToast({
                title: '获取数据失败',
                icon: 'none'
            });
            // 出错时设置为0
            this.setData({
                muyuTodayCount: 0,
                muyuTotalCount: 0,
                muyuStreakDays: 0,
                songboTodayCount: 0,
                songboTotalCount: 0,
                songboStreakDays: 0,
                muyuTodayMinutes: 0,
                muyuTotalMinutes: 0,
                songboTodayMinutes: 0,
                songboTotalMinutes: 0,
                userLevel: '初入山门'
            });
        });
    },
    
    /**
     * 计算连续打卡天数
     */
    calculateStreakDays(records) {
        // 添加防御性检查，确保records存在且是对象
        if (!records || typeof records !== 'object' || Object.keys(records).length === 0) {
            console.log("无记录或记录为空，连续天数为0");
            return 0;
        }
        
        try {
            // 获取所有日期并按降序排序
            const dates = Object.keys(records)
                .filter(date => records[date] && records[date] > 0)
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
        } catch (error) {
            console.error("计算连续打卡天数出错:", error);
            return 0;
        }
    },
    
    /**
     * 生成日历数据（最近两周）
     */
    generateCalendarData() {
        try {
            const today = new Date();
            
            // 确保从全局变量或存储中获取记录并进行防御性检查
            let muyuRecords = app.globalData.muyuRecords || {};
            if (!muyuRecords) muyuRecords = wx.getStorageSync('muyuRecords') || {};
            
            let songboRecords = app.globalData.songboRecords || {};
            if (!songboRecords) songboRecords = wx.getStorageSync('songboRecords') || {};
            
            console.log("生成日历数据 - 木鱼记录:", muyuRecords);
            console.log("生成日历数据 - 颂钵记录:", songboRecords);
            
            const calendarDays = [];
            
            // 生成最近14天的数据（包括今天）
            for (let i = 13; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                
                const muyuCount = muyuRecords && muyuRecords[dateString] ? muyuRecords[dateString] : 0;
                const songboCount = songboRecords && songboRecords[dateString] ? songboRecords[dateString] : 0;
                
                calendarDays.push({
                    date: dateString,
                    day: day,
                    isToday: i === 0,
                    muyuCount: muyuCount,
                    songboCount: songboCount
                });
            }
            
            this.setData({
                calendarDays
            });
        } catch (error) {
            console.error("生成日历数据出错:", error);
            // 出错时设置空数组
            this.setData({
                calendarDays: []
            });
        }
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
        console.log("in profileshanmen onShow")
        this.loadStatisticsData();
        this.generateCalendarData();
        this.loadRankingData();
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

    /**
     * 导航到主页
     */
    navigateToHome() {
        wx.navigateTo({
            url: '/pages/index/index'
        });
    },

    /**
     * 导航到用户信息修改页面
     */
    navigateToUserInfo() {
        wx.navigateTo({
            url: '/pages/login/login'
        });
    },

    /**
     * 加载用户排名数据
     */
    loadRankingData() {
        console.log("开始加载排名数据");
        
        const db = app.globalData.db;
        const _ = db.command;
        const currentUserOpenId = app.globalData.userInfo.openId;
        const today = this.getTodayDateString(); // 获取今天的日期
        
        // 预先定义usersMap，防止Promise错误时变量未定义
        let usersMap = {};
        let userStatsMap = {};
        
        // 获取所有用户信息
        db.collection("userinfo").get().then(userRes => {
            const users = userRes.data || [];
            
            // 创建用户信息映射表
            users.forEach(user => {
                if (user.openId) {
                    usersMap[user.openId] = {
                        openId: user.openId,
                        nickName: user.nickName || '禅修者',
                        avatarUrl: user.avatarUrl
                    };
                }
                console.log("获取到用户信息:", user);
            });
            
            console.log("获取到用户信息:", users.length, "个用户");
            
            // 从训练日志中聚合每个用户的总数据
            return db.collection("trainlog").where({
                // 查询条件，可以为空查询所有
            }).get();
        }).then(trainRes => {
            const trainRecords = trainRes.data || [];
            console.log("获取到训练记录:", trainRecords.length, "条记录");
            
            // 按用户ID聚合数据
            trainRecords.forEach(record => {
                if (!record.openId) return;
                
                if (!userStatsMap[record.openId]) {
                    userStatsMap[record.openId] = {
                        openId: record.openId,
                        muyuTotalCount: 0,
                        songboTotalCount: 0,
                        muyuTotalSeconds: 0,
                        songboTotalSeconds: 0,
                        muyuTodayCount: 0,
                        songboTodayCount: 0,
                        muyuTodaySeconds: 0,
                        songboTodaySeconds: 0
                    };
                }
                
                // 累加数据
                userStatsMap[record.openId].muyuTotalCount += (record.muyuCounts || 0);
                userStatsMap[record.openId].songboTotalCount += (record.songboCounts || 0);
                userStatsMap[record.openId].muyuTotalSeconds += (record.muyuSeconds || 0);
                userStatsMap[record.openId].songboTotalSeconds += (record.songboSeconds || 0);
                
                // 记录今日数据（只设置，不累加，因为今日只有一条记录）
                if (record.date === today) {
                    console.log(`今日记录 - 用户:${record.openId}, 木鱼:${record.muyuCounts}, 木鱼秒数:${record.muyuSeconds}, 颂钵:${record.songboCounts}, 颂钵秒数:${record.songboSeconds}`);
                    userStatsMap[record.openId].muyuTodayCount = record.muyuCounts || 0;
                    userStatsMap[record.openId].songboTodayCount = record.songboCounts || 0;
                    userStatsMap[record.openId].muyuTodaySeconds = record.muyuSeconds || 0;
                    userStatsMap[record.openId].songboTodaySeconds = record.songboSeconds || 0;
                }
            });
            
            // 如果当前用户ID存在，专门查询今日训练记录以确保获取最新数据
            if (currentUserOpenId) {
                // 直接从数据库查询今日记录
                return db.collection("trainlog").where({
                    openId: currentUserOpenId,
                    date: today
                }).get().then(todayRes => {
                    if (todayRes.data && todayRes.data.length > 0) {
                        const todayRecord = todayRes.data[0];
                        console.log(`今日单独查询记录 - ID:${todayRecord._id}, 木鱼:${todayRecord.muyuCounts}, 木鱼秒数:${todayRecord.muyuSeconds}, 颂钵:${todayRecord.songboCounts}, 颂钵秒数:${todayRecord.songboSeconds}`);
                        
                        // 确保用户在userStatsMap中存在
                        if (!userStatsMap[currentUserOpenId]) {
                            userStatsMap[currentUserOpenId] = {
                                openId: currentUserOpenId,
                                muyuTotalCount: todayRecord.muyuCounts || 0,
                                songboTotalCount: todayRecord.songboCounts || 0,
                                muyuTotalSeconds: todayRecord.muyuSeconds || 0,
                                songboTotalSeconds: todayRecord.songboSeconds || 0,
                                muyuTodayCount: todayRecord.muyuCounts || 0,
                                songboTodayCount: todayRecord.songboCounts || 0,
                                muyuTodaySeconds: todayRecord.muyuSeconds || 0,
                                songboTodaySeconds: todayRecord.songboSeconds || 0
                            };
                        } else {
                            // 更新今日数据
                            userStatsMap[currentUserOpenId].muyuTodayCount = todayRecord.muyuCounts || 0;
                            userStatsMap[currentUserOpenId].songboTodayCount = todayRecord.songboCounts || 0;
                            userStatsMap[currentUserOpenId].muyuTodaySeconds = todayRecord.muyuSeconds || 0;
                            userStatsMap[currentUserOpenId].songboTodaySeconds = todayRecord.songboSeconds || 0;
                        }
                    }
                    
                    // 继续处理本地数据
                    return this.processLocalData(userStatsMap, usersMap, currentUserOpenId, today, db);
                });
            }
            
            // 如果没有当前用户ID，直接处理本地数据
            return this.processLocalData(userStatsMap, usersMap, currentUserOpenId, today, db);
        }).then(result => {
            // rankingData将由processLocalData方法返回
            if (result && result.rankingData) {
                // 更新页面数据
                this.setData({
                    rankingList: result.rankingData
                });
                
                // 打印排行榜数据的关键信息
                result.rankingData.forEach(user => {
                    console.log(`用户排名信息 - ${user.nickName}: 今日(${user.todayMinutes}分钟/${user.todayCount}次), 累计(${user.totalMinutes}分钟/${user.totalCount}次)`);
                });
                
                console.log("排名数据:", result.rankingData);
                
                console.log("排名数据加载完成，共", result.rankingData.length, "名用户");
            }
        }).catch(err => {
            console.error("获取排名数据失败:", err);
            wx.showToast({
                title: '获取排名失败',
                icon: 'none',
                duration: 2000
            });
            
            // 出错时设置空排名列表
            this.setData({
                rankingList: []
            });
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
            const userLevel = this.calculateUserLevel(totalMinutes);
            
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
            // 如果今日时长相同，按今日敲击次数排序
            if (b.todayCount !== a.todayCount) {
                return b.todayCount - a.todayCount;
            }
            // 如果今日时长和敲击次数都相同，按总时长排序
            return b.totalMinutes - a.totalMinutes;
        });
        
        return { rankingData };
    }
}) 