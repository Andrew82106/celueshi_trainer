// 用户等级定义
export const USER_LEVELS = {
    INITIAL: '初入',
    BEGINNER: '九段',
    INTERMEDIATE: '八段',
    ADVANCED: '七段',
    MASTER: '六段',
    GRANDMASTER: '五段',
    IMMORTAL: '四段',
    IMMORTAL_MASTER: '三段',
    IMMORTAL_GRANDMASTER: '二段',
    IMMORTAL_IMMORTAL: '一段'
};



// 等级对应的训练时长要求（分钟）
export const LEVEL_REQUIREMENTS = {
    [USER_LEVELS.INITIAL]: 0,
    [USER_LEVELS.BEGINNER]: 10,
    [USER_LEVELS.INTERMEDIATE]: 60,
    [USER_LEVELS.ADVANCED]: 120,
    [USER_LEVELS.MASTER]: 500,
    [USER_LEVELS.GRANDMASTER]: 1500,
    [USER_LEVELS.IMMORTAL]: 4690,
    [USER_LEVELS.IMMORTAL_MASTER]: 9960,
    [USER_LEVELS.IMMORTAL_GRANDMASTER]: 18960,
    [USER_LEVELS.IMMORTAL_IMMORTAL]: 36960
};

// 星期标签
export const DAYS_OF_WEEK = ['日', '一', '二', '三', '四', '五', '六']; 

// 背景图片路径
export const BACKGROUND_IMAGES = [
    '/assets/picture/trainingBackground.jpeg',
    'cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/trainingBackground1.jpeg',
    'cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/trainingBackground2.jpeg',
    'cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/trainingBackground3.jpeg',
    "cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/trainingBackground4.jpeg",
    "cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/trainingBackground5.jpeg"
]; 