const app = getApp();
const { calculateStreakDays, calculateUserLevel, getTodayDateString } = require('../utils/index');

/**
 * 加载统计数据
 */
export function loadStatisticsData() {
    const today = getTodayDateString();
    const openId = app.globalData.userInfo.openId;
    
    console.log("加载统计数据 - 日期:", today);
    console.log("加载统计数据 - 用户ID:", openId);
    
    return app.globalData.db.collection("userinfo").where({
        openId: openId
    }).get().then(userRes => {
        if (userRes.data && userRes.data.length > 0) {
            console.log("获取用户信息成功:", userRes.data[0]);
            const originalOpenId = app.globalData.userInfo.openId;
            app.globalData.userInfo = {...userRes.data[0], openId: originalOpenId};
        }
        
        return app.globalData.db.collection("trainlog").where({
            openId: openId
        }).get();
    }).then(trainRes => {
        if (trainRes.data && trainRes.data.length > 0) {
            return processTrainingRecords(trainRes.data, today);
        } else {
            return getDefaultStats();
        }
    }).catch(err => {
        console.error("获取统计数据失败:", err);
        wx.showToast({
            title: '获取数据失败',
            icon: 'none'
        });
        return getDefaultStats();
    });
}

/**
 * 处理训练记录数据
 */
function processTrainingRecords(records, today) {
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
    
    records.forEach(record => {
        if (!record) return;
        
        muyuTotalCount += (record.muyuCounts || 0);
        songboTotalCount += (record.songboCounts || 0);
        muyuTotalSeconds += (record.muyuSeconds || 0);
        songboTotalSeconds += (record.songboSeconds || 0);
        
        if (record.date && record.muyuCounts && record.muyuCounts > 0) {
            muyuRecords[record.date] = record.muyuCounts;
        }
        
        if (record.date && record.songboCounts && record.songboCounts > 0) {
            songboRecords[record.date] = record.songboCounts;
        }
        
        if (record.date === today) {
            muyuTodayCount = record.muyuCounts || 0;
            songboTodayCount = record.songboCounts || 0;
            muyuTodaySeconds = record.muyuSeconds || 0;
            songboTodaySeconds = record.songboSeconds || 0;
        }
    });
    
    const muyuStreakDays = calculateStreakDays(muyuRecords);
    const songboStreakDays = calculateStreakDays(songboRecords);
    
    const muyuTodayMinutes = Math.ceil(muyuTodaySeconds / 60);
    const songboTodayMinutes = Math.ceil(songboTodaySeconds / 60);
    const muyuTotalMinutes = Math.ceil(muyuTotalSeconds / 60);
    const songboTotalMinutes = Math.ceil(songboTotalSeconds / 60);
    
    const userLevel = calculateUserLevel(muyuTotalMinutes + songboTotalMinutes);
    
    // 更新全局数据
    updateGlobalData({
        muyuRecords,
        songboRecords,
        muyuTodayCount,
        songboTodayCount,
        muyuTotalCount,
        songboTotalCount,
        muyuTodayMinutes,
        songboTodayMinutes,
        muyuTotalMinutes,
        songboTotalMinutes,
        userLevel
    });
    
    return {
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
    };
}

/**
 * 获取默认统计数据
 */
function getDefaultStats() {
    return {
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
    };
}

/**
 * 更新全局数据
 */
function updateGlobalData(data) {
    Object.keys(data).forEach(key => {
        app.globalData[key] = data[key];
        app.globalData.userInfo[key] = data[key];
    });
}

/**
 * 加载排名数据
 */
export function loadRankingData_() {
    const db = app.globalData.db;
    const today = getTodayDateString();
    const currentUserOpenId = app.globalData.userInfo.openId;
    console.log("加载排名数据 - 当前用户ID:", currentUserOpenId);
    console.log("加载排名数据 - 今日日期:", today);
    
    // 使用Promise.all同时获取用户信息和今日训练数据
    return Promise.all([
        // 获取所有用户信息（使用分页查询）
        getAllUserInfo(db),
        // 获取今日训练数据（使用分页查询）
        getAllTrainingData(db, today)
    ]).then(([usersData, trainData]) => {
        console.log("加载排名数据 - 获取用户信息成功");
        console.log(`加载排名数据 - 用户信息: 获取到${usersData.length}个用户`);
        console.log(`加载排名数据 - 训练记录: 获取到${trainData.length}条记录`);
        
        // 将用户数据转换为Map，以openId为键
        const usersMap = new Map();
        if (usersData && usersData.length > 0) {
            console.log(`获取到${usersData.length}个用户信息`);
            usersData.forEach(user => {
                if (user.openId) {
                    usersMap.set(user.openId, user);
                }
            });
        }
        
        // 将今日训练数据转换为Map，以openId为键
        const todayTrainMap = new Map();
        if (trainData && trainData.length > 0) {
            console.log(`获取到${trainData.length}条今日训练记录`);
            // 检查一下数据格式
            console.log("今日训练记录示例:", trainData[0]);
            
            trainData.forEach(record => {
                if (record.openId) {
                    // 记录示例输出，便于调试
                    if (record.openId === currentUserOpenId) {
                        console.log("当前用户今日训练记录:", record);
                    }
                    
                    // 如果同一用户有多条今日记录，累加它们的数据
                    const existingRecord = todayTrainMap.get(record.openId);
                    if (existingRecord) {
                        existingRecord.muyuCounts = (existingRecord.muyuCounts || 0) + (record.muyuCounts || 0);
                        existingRecord.songboCounts = (existingRecord.songboCounts || 0) + (record.songboCounts || 0);
                        existingRecord.muyuSeconds = (existingRecord.muyuSeconds || 0) + (record.muyuSeconds || 0);
                        existingRecord.songboSeconds = (existingRecord.songboSeconds || 0) + (record.songboSeconds || 0);
                        todayTrainMap.set(record.openId, existingRecord);
                    } else {
                        todayTrainMap.set(record.openId, {
                            muyuCounts: record.muyuCounts || 0,
                            songboCounts: record.songboCounts || 0,
                            muyuSeconds: record.muyuSeconds || 0,
                            songboSeconds: record.songboSeconds || 0
                        });
                    }
                }
            });
            console.log(`处理后的今日训练数据Map，包含${todayTrainMap.size}个用户`);
        } else {
            console.log(`今日(${today})没有训练记录`);
        }
        
        // 检查当前用户的本地数据
        if (currentUserOpenId) {
            updateCurrentUserTodayData(currentUserOpenId, todayTrainMap, today, db);
        }
        
        // 处理排名数据
        const rankingList = processUserRankingData(usersMap, todayTrainMap, currentUserOpenId);
        console.log(`排行榜生成完成，共${rankingList.length}个用户`);
        return rankingList;
    }).catch(err => {
        console.error("获取排名数据失败:", err);
        return [];
    });
}

/**
 * 分页获取所有用户数据
 * @param {Object} db - 数据库实例
 * @returns {Promise<Array>} - 包含所有用户数据的数组
 */
async function getAllUserInfo(db) {
    const MAX_LIMIT = 20; // 微信云开发单次查询最大20条记录
    let users = [];
    
    try {
        // 先获取总数
        const countResult = await db.collection('userinfo').count();
        const total = countResult.total;
        console.log(`用户总数：${total}`);
        
        // 计算需要分几次获取
        const batchTimes = Math.ceil(total / MAX_LIMIT);
        console.log(`需要分${batchTimes}次获取用户数据`);
        
        // 分批次获取数据
        const tasks = [];
        for (let i = 0; i < batchTimes; i++) {
            const promise = db.collection('userinfo')
                .skip(i * MAX_LIMIT)
                .limit(MAX_LIMIT)
                .get();
            tasks.push(promise);
        }
        
        // 等待所有请求完成
        const results = await Promise.all(tasks);
        
        // 合并结果
        results.forEach(res => {
            users = users.concat(res.data);
        });
        
        console.log(`成功获取全部${users.length}个用户数据`);
        return users;
    } catch (err) {
        console.error('获取所有用户数据失败:', err);
        return [];
    }
}

/**
 * 分页获取训练数据
 * @param {Object} db - 数据库实例
 * @param {String} date - 日期字符串 YYYY-MM-DD
 * @returns {Promise<Array>} - 包含所有训练数据的数组
 */
async function getAllTrainingData(db, date) {
    const MAX_LIMIT = 20; // 微信云开发单次查询最大20条记录
    let records = [];
    
    try {
        // 先获取总数
        const countResult = await db.collection('trainlog').where({
            date: date
        }).count();
        const total = countResult.total;
        console.log(`${date}日训练记录总数：${total}`);
        
        // 如果没有记录，直接返回空数组
        if (total === 0) {
            return [];
        }
        
        // 计算需要分几次获取
        const batchTimes = Math.ceil(total / MAX_LIMIT);
        console.log(`需要分${batchTimes}次获取训练记录`);
        
        // 分批次获取数据
        const tasks = [];
        for (let i = 0; i < batchTimes; i++) {
            const promise = db.collection('trainlog')
                .where({
                    date: date
                })
                .skip(i * MAX_LIMIT)
                .limit(MAX_LIMIT)
                .get();
            tasks.push(promise);
        }
        
        // 等待所有请求完成
        const results = await Promise.all(tasks);
        
        // 合并结果
        results.forEach(res => {
            records = records.concat(res.data);
        });
        
        console.log(`成功获取${date}日的全部${records.length}条训练记录`);
        return records;
    } catch (err) {
        console.error(`获取${date}日训练记录失败:`, err);
        return [];
    }
}

/**
 * 更新当前用户的今日数据
 */
function updateCurrentUserTodayData(currentUserOpenId, todayTrainMap, today, db) {
    // 获取本地记录
    const muyuRecords = wx.getStorageSync('muyuRecords') || {};
    const songboRecords = wx.getStorageSync('songboRecords') || {};
    const localMuyuTodayCount = muyuRecords[today] || 0;
    const localSongboTodayCount = songboRecords[today] || 0;
    
    // 从全局变量中获取当日训练时长（分钟）
    const globalMuyuTodayMinutes = app.globalData.muyuTodayMinutes || 0;
    const globalSongboTodayMinutes = app.globalData.songboTodayMinutes || 0;
    
    // 将分钟转换为秒
    const globalMuyuTodaySeconds = globalMuyuTodayMinutes > 0 ? globalMuyuTodayMinutes * 60 : 0;
    const globalSongboTodaySeconds = globalSongboTodayMinutes > 0 ? globalSongboTodayMinutes * 60 : 0;
    
    // 获取或创建今日训练记录
    let todayRecord = todayTrainMap.get(currentUserOpenId) || {
        muyuCounts: 0,
        songboCounts: 0,
        muyuSeconds: 0,
        songboSeconds: 0
    };
    
    // 比较本地和远端数据，取最大值
    let needUpdate = false;
    
    if (localMuyuTodayCount > todayRecord.muyuCounts) {
        todayRecord.muyuCounts = localMuyuTodayCount;
        needUpdate = true;
    }
    
    if (localSongboTodayCount > todayRecord.songboCounts) {
        todayRecord.songboCounts = localSongboTodayCount;
        needUpdate = true;
    }
    
    if (globalMuyuTodaySeconds > todayRecord.muyuSeconds) {
        todayRecord.muyuSeconds = globalMuyuTodaySeconds;
        needUpdate = true;
    }
    
    if (globalSongboTodaySeconds > todayRecord.songboSeconds) {
        todayRecord.songboSeconds = globalSongboTodaySeconds;
        needUpdate = true;
    }
    
    // 如果有更新，更新Map中的数据和数据库
    if (needUpdate) {
        todayTrainMap.set(currentUserOpenId, todayRecord);
        
        // 更新数据库中的记录
        if (todayTrainMap.has(currentUserOpenId)) {
            db.collection("trainlog").where({
                openId: currentUserOpenId,
                date: today
            }).get().then(res => {
                if (res.data && res.data.length > 0) {
                    // 更新现有记录
                    db.collection("trainlog").doc(res.data[0]._id).update({
                        data: {
                            muyuCounts: todayRecord.muyuCounts,
                            songboCounts: todayRecord.songboCounts,
                            muyuSeconds: todayRecord.muyuSeconds,
                            songboSeconds: todayRecord.songboSeconds
                        }
                    }).then(() => {
                        console.log("更新今日训练数据到数据库成功");
                    }).catch(err => {
                        console.error("更新今日训练数据到数据库失败:", err);
                    });
                } else {
                    // 创建新记录
                    db.collection("trainlog").add({
                        data: {
                            openId: currentUserOpenId,
                            date: today,
                            muyuCounts: todayRecord.muyuCounts,
                            songboCounts: todayRecord.songboCounts,
                            muyuSeconds: todayRecord.muyuSeconds,
                            songboSeconds: todayRecord.songboSeconds
                        }
                    }).then(() => {
                        console.log("添加今日训练数据到数据库成功");
                    }).catch(err => {
                        console.error("添加今日训练数据到数据库失败:", err);
                    });
                }
            }).catch(err => {
                console.error("查询今日记录失败:", err);
            });
        }
    }
}

/**
 * 处理用户排名数据
 */
function processUserRankingData(usersMap, todayTrainMap, currentUserOpenId) {
    const rankingData = [];
    
    // 遍历所有用户
    usersMap.forEach((user, openId) => {
        // 获取累积数据
        const accumulateMuyu = user.accumulateMuyu || 0;
        const accumulateMuyuTime = user.accumulateMuyuTime || 0;
        const accumulateSongbo = user.accumulateSongbo || 0;
        const accumulateSongboTime = user.accumulateSongboTime || 0;
        
        // 获取今日数据
        const todayTrain = todayTrainMap.get(openId) || {
            muyuCounts: 0,
            songboCounts: 0,
            muyuSeconds: 0,
            songboSeconds: 0
        };
        
        // 计算今日总次数和今日总时长（分钟）
        const todayCount = todayTrain.muyuCounts + todayTrain.songboCounts;
        const todaySeconds = todayTrain.muyuSeconds + todayTrain.songboSeconds;
        const todayMinutes = Math.ceil(todaySeconds / 60);
        
        // 计算累积总时长（分钟）
        const totalSeconds = accumulateMuyuTime + accumulateSongboTime;
        const totalMinutes = Math.ceil(totalSeconds / 60);
        
        // 使用util中的函数计算用户段位
        const userLevel = calculateUserLevel(totalMinutes);
        
        // 添加所有用户到排行榜，不限制条件
        rankingData.push({
            openId,
            nickName: user.nickName || '禅修者',
            avatarUrl: user.avatarUrl || '',
            muyuTotalCount: accumulateMuyu,
            songboTotalCount: accumulateSongbo,
            muyuTodayCount: todayTrain.muyuCounts,
            songboTodayCount: todayTrain.songboCounts,
            muyuTotalSeconds: accumulateMuyuTime,
            songboTotalSeconds: accumulateSongboTime,
            muyuTodaySeconds: todayTrain.muyuSeconds,
            songboTodaySeconds: todayTrain.songboSeconds,
            totalCount: accumulateMuyu + accumulateSongbo,
            todayCount,
            totalMinutes,
            todayMinutes,
            userLevel,
            isCurrentUser: openId === currentUserOpenId
        });
    });
    
    // 如果当前用户存在并且有今日数据，更新页面上的用户段位
    if (currentUserOpenId) {
        const currentUser = rankingData.find(user => user.openId === currentUserOpenId);
        if (currentUser) {
            app.globalData.userLevel = currentUser.userLevel;
        }
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
    
    return rankingData;
}