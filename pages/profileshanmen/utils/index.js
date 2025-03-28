/**
 * 获取今天的日期字符串（YYYY-MM-DD格式）
 */
export function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 计算连续打卡天数
 */
export function calculateStreakDays(records) {
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
export function calculateUserLevel(totalMinutes) {
    const { USER_LEVELS, LEVEL_REQUIREMENTS } = require('../constants/index');
    
    // 从高到低检查每个等级要求
    if (totalMinutes >= LEVEL_REQUIREMENTS[USER_LEVELS.IMMORTAL_IMMORTAL]) {
        return USER_LEVELS.IMMORTAL_IMMORTAL;
    } else if (totalMinutes >= LEVEL_REQUIREMENTS[USER_LEVELS.IMMORTAL_GRANDMASTER]) {
        return USER_LEVELS.IMMORTAL_GRANDMASTER;
    } else if (totalMinutes >= LEVEL_REQUIREMENTS[USER_LEVELS.IMMORTAL_MASTER]) {
        return USER_LEVELS.IMMORTAL_MASTER;
    } else if (totalMinutes >= LEVEL_REQUIREMENTS[USER_LEVELS.IMMORTAL]) {
        return USER_LEVELS.IMMORTAL;
    } else if (totalMinutes >= LEVEL_REQUIREMENTS[USER_LEVELS.GRANDMASTER]) {
        return USER_LEVELS.GRANDMASTER;
    } else if (totalMinutes >= LEVEL_REQUIREMENTS[USER_LEVELS.MASTER]) {
        return USER_LEVELS.MASTER;
    } else if (totalMinutes >= LEVEL_REQUIREMENTS[USER_LEVELS.ADVANCED]) {
        return USER_LEVELS.ADVANCED;
    } else if (totalMinutes >= LEVEL_REQUIREMENTS[USER_LEVELS.INTERMEDIATE]) {
        return USER_LEVELS.INTERMEDIATE;
    } else if (totalMinutes >= LEVEL_REQUIREMENTS[USER_LEVELS.BEGINNER]) {
        return USER_LEVELS.BEGINNER;
    } else {
        return USER_LEVELS.INITIAL;
    }
} 