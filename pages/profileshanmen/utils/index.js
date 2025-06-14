/**
 * 获取今天的日期字符串（YYYY-MM-DD格式）
 */
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 计算连续打卡天数
 */
function calculateStreakDays(records) {
    if (!records || typeof records !== 'object' || Object.keys(records).length === 0) {
        console.log("无记录或记录为空，连续天数为0");
        return 0;
    }
    
    try {
        const dates = Object.keys(records)
            .filter(date => records[date] && records[date] > 0)
            .sort((a, b) => new Date(b) - new Date(a));
        
        if (dates.length === 0) {
            return 0;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastRecordDate = new Date(dates[0]);
        lastRecordDate.setHours(0, 0, 0, 0);
        
        // 如果最后一次记录不是今天或昨天，则连续天数为0
        const diffDays = Math.floor((today - lastRecordDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
            return 0;
        }
        
        let streak = 0;
        let currentDate = new Date(dates[0]);
        
        for (let i = 0; i < dates.length; i++) {
            const recordDate = new Date(dates[i]);
            recordDate.setHours(0, 0, 0, 0);
            
            const dayDiff = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
            
            if (dayDiff === 1) {
                streak++;
                currentDate = recordDate;
            } else if (dayDiff === 0) {
                continue;
            } else {
                break;
            }
        }
        
        return streak + 1;
    } catch (error) {
        console.error("计算连续天数时出错:", error);
        return 0;
    }
}

/**
 * 计算用户等级
 */
function calculateUserLevel(totalMinutes) {
    const { USER_LEVELS, LEVEL_REQUIREMENTS } = require('../constants/index');
    console.log(`[计算用户等级] 输入的总分钟数: ${totalMinutes}`);
    
    // 从低到高检查每个等级要求
    if (totalMinutes < LEVEL_REQUIREMENTS[USER_LEVELS.BEGINNER]) {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.INITIAL}`);
        return USER_LEVELS.INITIAL;
    } else if (totalMinutes < LEVEL_REQUIREMENTS[USER_LEVELS.INTERMEDIATE]) {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.BEGINNER}`);
        return USER_LEVELS.BEGINNER;
    } else if (totalMinutes < LEVEL_REQUIREMENTS[USER_LEVELS.ADVANCED]) {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.INTERMEDIATE}`);
        return USER_LEVELS.INTERMEDIATE;
    } else if (totalMinutes < LEVEL_REQUIREMENTS[USER_LEVELS.MASTER]) {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.ADVANCED}`);
        return USER_LEVELS.ADVANCED;
    } else if (totalMinutes < LEVEL_REQUIREMENTS[USER_LEVELS.GRANDMASTER]) {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.MASTER}`);
        return USER_LEVELS.MASTER;
    } else if (totalMinutes < LEVEL_REQUIREMENTS[USER_LEVELS.IMMORTAL]) {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.GRANDMASTER}`);
        return USER_LEVELS.GRANDMASTER;
    } else if (totalMinutes < LEVEL_REQUIREMENTS[USER_LEVELS.IMMORTAL_MASTER]) {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.IMMORTAL}`);
        return USER_LEVELS.IMMORTAL;
    } else if (totalMinutes < LEVEL_REQUIREMENTS[USER_LEVELS.IMMORTAL_GRANDMASTER]) {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.IMMORTAL_MASTER}`);
        return USER_LEVELS.IMMORTAL_MASTER;
    } else if (totalMinutes < LEVEL_REQUIREMENTS[USER_LEVELS.IMMORTAL_IMMORTAL]) {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.IMMORTAL_GRANDMASTER}`);
        return USER_LEVELS.IMMORTAL_GRANDMASTER;
    } else {
        console.log(`[计算用户等级] 结果: ${USER_LEVELS.IMMORTAL_IMMORTAL}`);
        return USER_LEVELS.IMMORTAL_IMMORTAL;
    }
}

/**
 * 更新用户level字段
 * @param {string} openId - 用户openId
 * @param {Object} db - 数据库实例
 */
function updateUserLevel(openId, db) {
    console.log(`[更新用户等级] 开始更新用户 ${openId} 的等级`);
    // 查询用户累计训练时间
    return db.collection("userinfo").where({
        openId: openId
    }).get().then(res => {
        if (res.data && res.data.length > 0) {
            const userInfo = res.data[0];
            // 计算总分钟数
            const accumulateMuyuTime = userInfo.accumulateMuyuTime || 0;
            const accumulateSongboTime = userInfo.accumulateSongboTime || 0;
            const totalSeconds = accumulateMuyuTime + accumulateSongboTime;
            const totalMinutes = Math.ceil(totalSeconds / 60);
            
            console.log(`[更新用户等级] 用户训练数据: 木鱼${accumulateMuyuTime}秒, 颂钵${accumulateSongboTime}秒, 总共${totalMinutes}分钟`);
            
            // 计算用户段位
            const userLevel = calculateUserLevel(totalMinutes);
            
            // 更新用户段位
            return db.collection("userinfo").where({
                openId: openId
            }).update({
                data: {
                    level: userLevel
                }
            }).then(updateRes => {
                console.log(`[更新用户等级] 更新用户段位成功: ${userLevel}`, updateRes);
                return updateRes;
            }).catch(err => {
                console.error("[更新用户等级] 更新用户段位失败:", err);
                throw err;
            });
        } else {
            console.warn(`[更新用户等级] 未找到用户信息: ${openId}`);
        }
    }).catch(err => {
        console.error("[更新用户等级] 查询用户信息失败:", err);
        throw err;
    });
}

/**
 * 判断用户是否在线
 * @param {string} userId - 用户ID
 * @param {Date|number} lastActiveTime - 最后活跃时间
 * @param {string} currentUserId - 当前登录用户ID
 * @returns {boolean} 是否在线
 */
function isUserOnline(userId, lastActiveTime, currentUserId) {
    // 如果是当前用户，始终返回在线
    if (userId === currentUserId) {
        return true;
    }
    
    // 如果没有最后活跃时间，返回离线
    if (!lastActiveTime) {
        return false;
    }
    
    // 计算时间差（毫秒）
    const now = Date.now();
    const lastActive = typeof lastActiveTime === 'object' ? lastActiveTime.getTime() : lastActiveTime;
    const timeDiff = now - lastActive;
    
    // 1分钟内活跃视为在线
    return timeDiff < 60000;
}

// 导出所有函数
module.exports = {
    getTodayDateString,
    calculateStreakDays,
    calculateUserLevel,
    updateUserLevel,
    isUserOnline
}; 