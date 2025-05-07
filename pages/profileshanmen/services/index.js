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
    
    // 从用户信息中获取段位，不再计算
    const userLevel = app.globalData.userInfo.level || '初入山门';
    
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
        userLevel: '初入'
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
    
    // 使用Promise.all同时获取用户信息、今日训练数据和用户在线状态数据
    return Promise.all([
        // 获取所有用户信息（使用分页查询）
        getAllUserInfo(db),
        // 获取今日训练数据（使用分页查询）
        getAllTrainingData(db, today),
        // 获取用户在线状态数据
        getAllUserOnlineStatus(db)
    ]).then(([usersData, trainData, onlineStatusData]) => {
        console.log("加载排名数据 - 获取用户信息成功");
        console.log(`加载排名数据 - 用户信息: 获取到${usersData.length}个用户`);
        console.log(`加载排名数据 - 训练记录: 获取到${trainData.length}条记录`);
        console.log(`加载排名数据 - 在线状态: 获取到${onlineStatusData.length}条记录`);
        
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
        
        // 将在线状态数据转换为Map，以openId为键
        const onlineStatusMap = new Map();
        if (onlineStatusData && onlineStatusData.length > 0) {
            console.log(`[在线状态] 获取到${onlineStatusData.length}条用户在线状态记录`);
            console.log(`[在线状态] 详细记录:`, JSON.stringify(onlineStatusData));
            
            // 调试输出当前用户的openId
            console.log(`[在线状态调试] 当前用户openId: ${currentUserOpenId}`);
            
            onlineStatusData.forEach(status => {
                if (status.openId) {
                    // 判断用户是否在线（最后活跃时间在1分钟内）
                    const now = Date.now();
                    const lastActive = status.lastActiveTime;
                    const timeDiff = now - lastActive;
                    const timeout = app.globalData.offlineTimeout;
                    let isActive = timeDiff < timeout;
                    
                    // 如果是当前用户，添加额外调试信息
                    if (status.openId === currentUserOpenId) {
                        console.log(`[在线状态调试] 找到当前用户在线状态记录！`);
                        console.log(`[在线状态调试] 当前用户在线状态比较：`);
                        console.log(`[在线状态调试] - 数据库中的openId: ${status.openId}`);
                        console.log(`[在线状态调试] - 全局变量中的openId: ${currentUserOpenId}`);
                        console.log(`[在线状态调试] - 长度比较: ${status.openId.length} vs ${currentUserOpenId.length}`);
                        console.log(`[在线状态调试] - 字符串完全匹配: ${status.openId === currentUserOpenId}`);
                        
                        // 确保当前用户在线
                        isActive = true;
                    }
                    
                    console.log(`[在线状态] 用户${status.openId} - 判定详情:
                    - 当前时间: ${now}
                    - 最后活跃: ${lastActive}
                    - 时间差: ${timeDiff}ms
                    - 超时时间: ${timeout}ms
                    - 状态标记: ${status.isOnline ? '在线' : '离线'}
                    - 活跃判定: ${isActive ? '在线' : '超时'}
                    - 最终判定: ${(status.isOnline && isActive) ? '在线' : '离线'}`);
                    
                    // 修复问题：对于当前用户，强制设置在线状态为true
                    const finalIsOnline = (status.openId === currentUserOpenId) ? 
                        true : (status.isOnline && isActive);
                    
                    onlineStatusMap.set(status.openId, {
                        isOnline: finalIsOnline,
                        lastActiveTime: status.lastActiveTime
                    });
                }
            });
            
            // 统计在线用户数
            let onlineCount = 0;
            let onlineUsers = [];
            onlineStatusMap.forEach((status, openId) => {
                if (status.isOnline) {
                    onlineCount++;
                    onlineUsers.push(openId);
                }
            });
            console.log(`[在线状态] 当前共有${onlineCount}个用户在线`);
            console.log(`[在线状态] 在线用户ID: ${JSON.stringify(onlineUsers)}`);
        } else {
            console.log(`[在线状态] 没有获取到用户在线状态记录`);
        }
        
        // 检查当前用户的本地数据
        if (currentUserOpenId) {
            updateCurrentUserTodayData(currentUserOpenId, todayTrainMap, today, db);
        }
        
        // 处理排名数据
        const rankingList = processUserRankingData(usersMap, todayTrainMap, currentUserOpenId, onlineStatusMap);
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
function processUserRankingData(usersMap, todayTrainMap, currentUserOpenId, onlineStatusMap) {
    const rankingData = [];
    
    console.log(`[在线状态调试] 处理用户排名数据，当前用户ID: ${currentUserOpenId}`);
    console.log(`[在线状态调试] 在线状态Map大小: ${onlineStatusMap.size}`);
    
    // 如果当前用户存在，检查是否有在线状态记录
    if (currentUserOpenId) {
        const currentUserOnlineStatus = onlineStatusMap.get(currentUserOpenId);
        console.log(`[在线状态调试] 当前用户在线状态记录: ${JSON.stringify(currentUserOnlineStatus || '未找到')}`);
    }
    
    // 处理每个用户的数据
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
        
        // 直接从用户信息中读取level字段，如果没有则使用默认值
        const userLevel = user.level || '初入山门';
        
        // 获取用户在线状态
        const onlineStatus = onlineStatusMap.get(openId) || { isOnline: false };
        
        // 如果是当前用户，添加调试信息
        if (openId === currentUserOpenId) {
            console.log(`[在线状态调试] 处理当前用户的排名数据:`);
            console.log(`[在线状态调试] - 昵称: ${user.nickName || '禅修者'}`);
            console.log(`[在线状态调试] - 在线状态: ${onlineStatus.isOnline ? '在线' : '离线'}`);
        }
        
        // 获取当前用户的openId
        const currentUserOpenId = app.globalData.userInfo && app.globalData.userInfo.openId;
        
        // 如果是当前用户，确保显示为在线
        const isCurrentUser = currentUserOpenId && openId === currentUserOpenId;
        const finalIsOnline = isCurrentUser ? true : onlineStatus.isOnline;
        
        // 添加到排行榜
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
            isCurrentUser: isCurrentUser,
            isOnline: finalIsOnline
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

/**
 * 获取所有用户在线状态数据
 */
function getAllUserOnlineStatus(db) {
    return new Promise((resolve, reject) => {
        // 设置查询批次大小
        const batchSize = 100;
        let lastId = null;
        let allData = [];
        
        // 递归函数，用于分批获取数据
        function fetchBatch() {
            let query = db.collection('userOnlineStatus').limit(batchSize);
            
            // 如果有上一批次的最后一个ID，则从该ID之后开始查询
            if (lastId) {
                query = query.where({
                    _id: db.command.gt(lastId)
                });
            }
            
            query.orderBy('_id', 'asc').get().then(res => {
                const data = res.data;
                
                if (data && data.length > 0) {
                    // 合并数据
                    allData = allData.concat(data);
                    
                    // 如果返回的数据量等于批次大小，说明可能还有更多数据
                    if (data.length === batchSize) {
                        // 记录最后一个ID，继续获取下一批次
                        lastId = data[data.length - 1]._id;
                        fetchBatch();
                    } else {
                        // 数据获取完毕
                        resolve(allData);
                    }
                } else {
                    // 没有数据
                    resolve(allData);
                }
            }).catch(err => {
                console.error('获取用户在线状态数据失败:', err);
                reject(err);
            });
        }
        
        // 开始获取第一批数据
        fetchBatch();
    });
}

/**
 * 获取指定日期范围内的训练数据
 * @param {Object} db - 数据库实例
 * @param {String} startDate - 开始日期，格式：YYYY-MM-DD
 * @param {String} endDate - 结束日期，格式：YYYY-MM-DD
 * @returns {Promise<Array>} - 包含该日期范围内所有训练数据的数组
 */
async function getTrainingDataByDateRange(db, startDate, endDate) {
    const MAX_LIMIT = 20; // 微信云开发单次查询最大20条记录
    let records = [];
    
    try {
        // 先获取符合条件的记录总数
        const countResult = await db.collection('trainlog')
            .where({
                date: db.command.gte(startDate).and(db.command.lte(endDate))
            })
            .count();
        
        const total = countResult.total;
        console.log(`日期范围[${startDate}~${endDate}]内的训练记录总数：${total}`);
        
        // 计算需要分几次获取
        const batchTimes = Math.ceil(total / MAX_LIMIT);
        console.log(`需要分${batchTimes}次获取训练数据`);
        
        // 分批次获取数据
        const tasks = [];
        for (let i = 0; i < batchTimes; i++) {
            const promise = db.collection('trainlog')
                .where({
                    date: db.command.gte(startDate).and(db.command.lte(endDate))
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
        
        console.log(`成功获取日期范围[${startDate}~${endDate}]内共${records.length}条训练记录`);
        return records;
    } catch (err) {
        console.error(`获取日期范围[${startDate}~${endDate}]内的训练数据失败:`, err);
        return [];
    }
}

/**
 * 按用户ID分组，计算指定时间范围内的训练数据
 * @param {Array} records - 训练记录数组
 * @returns {Map} - 以用户ID为键，训练数据汇总为值的Map
 */
function groupTrainingDataByUser(records) {
    const userTrainingMap = new Map();
    
    if (!records || records.length === 0) {
        return userTrainingMap;
    }
    
    records.forEach(record => {
        if (!record.openId) return;
        
        const existingData = userTrainingMap.get(record.openId);
        if (existingData) {
            // 更新现有用户的数据
            existingData.muyuCounts += (record.muyuCounts || 0);
            existingData.songboCounts += (record.songboCounts || 0);
            existingData.muyuSeconds += (record.muyuSeconds || 0);
            existingData.songboSeconds += (record.songboSeconds || 0);
            userTrainingMap.set(record.openId, existingData);
        } else {
            // 添加新用户的数据
            userTrainingMap.set(record.openId, {
                muyuCounts: record.muyuCounts || 0,
                songboCounts: record.songboCounts || 0,
                muyuSeconds: record.muyuSeconds || 0,
                songboSeconds: record.songboSeconds || 0
            });
        }
    });
    
    return userTrainingMap;
}

/**
 * 加载指定日期范围内的排名数据
 * @param {Object} db - 数据库实例
 * @param {String} startDate - 开始日期，格式：YYYY-MM-DD
 * @param {String} endDate - 结束日期，格式：YYYY-MM-DD
 * @returns {Promise<Array>} - 排行榜数据数组
 */
export async function loadRankingDataByDateRange(db, startDate, endDate) {
    try {
        // 获取所有用户信息
        const usersData = await getAllUserInfo(db);
        
        // 获取指定日期范围内的训练数据
        const trainData = await getTrainingDataByDateRange(db, startDate, endDate);
        
        // 获取用户在线状态
        const onlineStatusData = await getAllUserOnlineStatus(db);
        
        console.log(`加载[${startDate}~${endDate}]排名数据 - 获取用户信息成功`);
        console.log(`加载[${startDate}~${endDate}]排名数据 - 用户信息: 获取到${usersData.length}个用户`);
        console.log(`加载[${startDate}~${endDate}]排名数据 - 训练记录: 获取到${trainData.length}条记录`);
        console.log(`加载[${startDate}~${endDate}]排名数据 - 在线状态: 获取到${onlineStatusData.length}条记录`);
        
        // 将用户数据转换为Map，以openId为键
        const usersMap = new Map();
        if (usersData && usersData.length > 0) {
            usersData.forEach(user => {
                if (user.openId) {
                    usersMap.set(user.openId, user);
                }
            });
        }
        
        // 按用户ID分组，计算指定时间范围内的训练数据
        const userTrainingMap = groupTrainingDataByUser(trainData);
        
        // 将在线状态数据转换为Map，以openId为键
        const onlineStatusMap = new Map();
        if (onlineStatusData && onlineStatusData.length > 0) {
            onlineStatusData.forEach(status => {
                if (status.openId) {
                    const now = Date.now();
                    const lastActive = status.lastActiveTime;
                    const timeDiff = now - lastActive;
                    const timeout = app.globalData.offlineTimeout || 300000; // 默认5分钟超时
                    let isActive = timeDiff < timeout;
                    
                    // 获取当前用户的openId
                    const currentUserOpenId = app.globalData.userInfo && app.globalData.userInfo.openId;
                    
                    // 如果是当前用户，确保显示为在线
                    if (currentUserOpenId && status.openId === currentUserOpenId) {
                        console.log(`[在线状态调试] loadRankingDataByDateRange - 找到当前用户状态记录`);
                        isActive = true;
                    }
                    
                    // 对于当前用户，强制设置在线状态为true
                    const finalIsOnline = (currentUserOpenId && status.openId === currentUserOpenId) ? 
                        true : (status.isOnline && isActive);
                    
                    onlineStatusMap.set(status.openId, {
                        isOnline: finalIsOnline,
                        lastActiveTime: status.lastActiveTime
                    });
                }
            });
        }
        
        // 生成排行榜数据
        const rankingData = [];
        
        usersMap.forEach((user, openId) => {
            // 获取用户累积数据
            const accumulateMuyu = user.accumulateMuyu || 0;
            const accumulateMuyuTime = user.accumulateMuyuTime || 0;
            const accumulateSongbo = user.accumulateSongbo || 0;
            const accumulateSongboTime = user.accumulateSongboTime || 0;
            
            // 获取指定时间范围内的数据
            const rangeData = userTrainingMap.get(openId) || {
                muyuCounts: 0,
                songboCounts: 0,
                muyuSeconds: 0,
                songboSeconds: 0
            };
            
            // 计算指定时间范围内的总次数和总时长（分钟）
            const rangeCount = rangeData.muyuCounts + rangeData.songboCounts;
            const rangeSeconds = rangeData.muyuSeconds + rangeData.songboSeconds;
            const rangeMinutes = Math.ceil(rangeSeconds / 60);
            
            // 计算累积总时长（分钟）
            const totalSeconds = accumulateMuyuTime + accumulateSongboTime;
            const totalMinutes = Math.ceil(totalSeconds / 60);
            
            // 获取用户段位
            const userLevel = user.level || '初入山门';
            
            // 获取用户在线状态
            const onlineStatus = onlineStatusMap.get(openId) || { isOnline: false };
            
            // 获取当前用户的openId
            const currentUserOpenId = app.globalData.userInfo && app.globalData.userInfo.openId;
            
            // 如果是当前用户，确保显示为在线
            const isCurrentUser = currentUserOpenId && openId === currentUserOpenId;
            const finalIsOnline = isCurrentUser ? true : onlineStatus.isOnline;
            
            // 添加到排行榜
            rankingData.push({
                openId,
                nickName: user.nickName || '禅修者',
                avatarUrl: user.avatarUrl || '',
                rangeMuyuCount: rangeData.muyuCounts,
                rangeSongboCount: rangeData.songboCounts,
                rangeMuyuMinutes: Math.ceil(rangeData.muyuSeconds / 60),
                rangeSongboMinutes: Math.ceil(rangeData.songboSeconds / 60),
                rangeCount,
                rangeMinutes,
                muyuTotalCount: accumulateMuyu,
                songboTotalCount: accumulateSongbo,
                totalCount: accumulateMuyu + accumulateSongbo,
                totalMinutes,
                userLevel,
                isCurrentUser: isCurrentUser,
                isOnline: finalIsOnline
            });
        });
        
        // 按指定时间范围内的时长排序（降序）
        rankingData.sort((a, b) => {
            return b.rangeMinutes - a.rangeMinutes;
        });
        
        return rankingData;
        
    } catch (err) {
        console.error(`加载[${startDate}~${endDate}]排名数据失败:`, err);
        return [];
    }
}