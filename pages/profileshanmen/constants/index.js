// 用户等级定义
export const USER_LEVELS = {
    INITIAL: '初入山门',
    BEGINNER: '山门一段',
    INTERMEDIATE: '山门二段',
    ADVANCED: '山门三段',
    MASTER: '山门四段',
    GRANDMASTER: '山门五段',
    IMMORTAL: '山门六段',
    IMMORTAL_MASTER: '山门七段',
    IMMORTAL_GRANDMASTER: '山门八段',
    IMMORTAL_IMMORTAL: '山门九段'
    
};



// 等级对应的训练时长要求（分钟）
export const LEVEL_REQUIREMENTS = {
    [USER_LEVELS.INITIAL]: 0,
    [USER_LEVELS.BEGINNER]: 10,
    [USER_LEVELS.INTERMEDIATE]: 60,
    [USER_LEVELS.ADVANCED]: 120,
    [USER_LEVELS.MASTER]: 200,
    [USER_LEVELS.GRANDMASTER]: 300,
    [USER_LEVELS.IMMORTAL]: 600,
    [USER_LEVELS.IMMORTAL_MASTER]: 900,
    [USER_LEVELS.IMMORTAL_GRANDMASTER]: 1200,
    [USER_LEVELS.IMMORTAL_IMMORTAL]: 1500
};

// 星期标签
export const DAYS_OF_WEEK = ['日', '一', '二', '三', '四', '五', '六']; 

// 背景图片路径
export const BACKGROUND_IMAGES = [
    '/assets/picture/trainingBackground.jpeg',
    'cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/trainingBackground1.jpeg',
    'cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/trainingBackground2.jpeg',
    'cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/trainingBackground3.jpeg'
]; 