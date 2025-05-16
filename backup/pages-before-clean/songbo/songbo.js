const app = getApp();
import { BACKGROUND_IMAGES } from '../../pages/profileshanmen/constants/index';

Page({
    /**
     * 页面的初始数据
     */
    data: {
        count: 0,           // 今日敲击计数
        totalCount: 0,      // 总敲击计数
        isAnimating: false, // 颂钵动画状态
        showModal: false,   // 模态框显示状态
        interval: 2,        // 自动敲击间隔（秒）
        isAutoTapping: false, // 是否正在自动敲击
        autoTapTimer: null,  // 自动敲击定时器
        today: '',          // 当前日期
        isTraining: false,  // 是否正在训练
        trainingStartTime: null, // 训练开始时间
        trainingSeconds: 0, // 训练时长（秒）
        trainingTimer: null, // 训练计时器
        autoTapDuration: 5, // 自动敲击持续时间（分钟）
        autoTapEndTimer: null, // 自动敲击结束计时器
        isMuted: false,     // 是否静音
        currentBackground: BACKGROUND_IMAGES[0], // 当前背景图片
        
        // 离线训练上传相关数据
        showUploadModal: false,      // 上传模态框显示状态
        offlineTrainingMinutes: '',  // 离线训练时长（分钟）
        offlineTapDuration: '',      // 单次敲击长度（秒）
        calculatedTapCount: 0,        // 计算得出的敲击次数
        
        // 在线用户数量
        onlineUserCount: 0,           // 当前在线用户数量
        onlineCountTimer: null        // 在线用户数量刷新定时器
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 获取今天的日期字符串 (格式: YYYY-MM-DD)
        const today = this.getTodayDateString();
        
        this.setData({
            today: today
        });
        
        // 直接调用刷新按钮绑定的函数获取今日记录
        this.loadTodayRecordDirectly();
        
        // 获取当前在线用户数量
        this.getOnlineUserCount();
        
        // 设置定时器每30秒刷新一次在线用户数量
        const onlineCountTimer = setInterval(() => {
            this.getOnlineUserCount();
        }, 30000); // 30秒刷新一次
        
        this.setData({
            onlineCountTimer: onlineCountTimer
        });
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
     * 从数据库加载训练数据
     */
    loadTrainingDataFromDB() {
        const openId = app.globalData.userInfo.openId;
        if (!openId) {
            console.log("未登录或openId不存在，使用本地缓存");
            this.loadFromLocalStorage();
            return;
        }
        
        const today = this.data.today;
        const db = app.globalData.db;
        
        // 直接按日期查询今日记录
        db.collection("trainlog").where({
            openId: openId,
            date: today
        }).get().then(res => {
            console.log("按日期直接查询今日记录结果:", res);
            
            let todayCount = 0;
            
            if (res.data && res.data.length > 0) {
                const todayRecord = res.data[0];
                todayCount = todayRecord.songboCounts || 0;
                console.log("今日颂钵记录:", todayCount);
            } else {
                console.log("没有找到今日记录，使用默认值0");
            }
            
            // 更新页面今日计数
            this.setData({
                count: todayCount
            });
            
            // 查询所有记录以计算总计数
            this.calculateTotalCount();
            
        }).catch(err => {
            console.error("获取今日训练记录失败:", err);
            // 出错时使用本地缓存数据
            this.loadFromLocalStorage();
        });
    },
    
    /**
     * 计算总计数
     */
    calculateTotalCount() {
        const openId = app.globalData.userInfo.openId;
        const db = app.globalData.db;
        
        db.collection("trainlog").where({
            openId: openId
        }).get().then(res => {
            let totalCount = 0;
            
            if (res.data && res.data.length > 0) {
                // 遍历所有训练记录
                res.data.forEach(record => {
                    // 累计总敲击次数
                    totalCount += record.songboCounts || 0;
                });
            }
            
            // 更新页面总计数
            this.setData({
                totalCount: totalCount
            });
            
            // 更新全局数据和本地缓存
            this.updateGlobalAndLocalData(this.data.count, totalCount);
            
        }).catch(err => {
            console.error("获取所有训练记录失败:", err);
            // 尝试从本地缓存获取总计数
            const songboRecords = wx.getStorageSync('songboRecords') || {};
            let totalCount = 0;
            for (const date in songboRecords) {
                totalCount += songboRecords[date];
            }
            
            this.setData({
                totalCount: totalCount
            });
            
            this.updateGlobalAndLocalData(this.data.count, totalCount);
        });
    },
    
    /**
     * 从本地存储加载数据（作为备用方案）
     */
    loadFromLocalStorage() {
        // 从缓存中读取所有敲击记录
        const songboRecords = wx.getStorageSync('songboRecords') || {};
        const todayCount = songboRecords[this.data.today] || 0;
        
        // 计算总计数
        let totalCount = 0;
        for (const date in songboRecords) {
            totalCount += songboRecords[date];
        }
        
        this.setData({
            count: todayCount,
            totalCount: totalCount
        });
    },
    
    /**
     * 更新全局数据和本地缓存
     */
    updateGlobalAndLocalData(todayCount, totalCount) {
        // 更新本地缓存
        const songboRecords = wx.getStorageSync('songboRecords') || {};
        songboRecords[this.data.today] = todayCount;
        wx.setStorageSync('songboRecords', songboRecords);
        
        // 更新全局数据
        if (app.globalData) {
            app.globalData.songboRecords = songboRecords;
            app.globalData.songboTodayCount = todayCount;
            app.globalData.songboTotalCount = totalCount;
        }
    },
    
    /**
     * 敲击颂钵
     */
    tapSongbo() {
        // 如果没有开始训练，则不允许敲击
        if (!this.data.isTraining) {
            wx.showToast({
                title: '请先点击开始训练',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        
        // 更新今日计数
        const newCount = this.data.count + 1;
        const newTotalCount = this.data.totalCount + 1;
        
        this.setData({
            count: newCount,
            totalCount: newTotalCount,
            isAnimating: true
        });
        
        // 在本地先保存计数
        this.saveCountToStorage(newCount);
        
        // 播放音效
        this.playSound();
        
        // 动画效果
        setTimeout(() => {
            this.setData({
                isAnimating: false
            });
        }, 100);
    },
    
    /**
     * 保存计数到本地存储
     */
    saveCountToStorage(count) {
        // 保存到本地存储
        const songboRecords = wx.getStorageSync('songboRecords') || {};
        songboRecords[this.data.today] = count;
        wx.setStorageSync('songboRecords', songboRecords);
        
        // 尝试保存到云端数据库
        if (app.globalData.isLoggedIn && app.globalData.userInfo.openId) {
            this.saveCountToDB(count);
        } else {
            console.log('用户未登录，暂不保存到云端');
        }
    },
    
    /**
     * 将计数保存到云数据库
     */
    saveCountToDB(count) {
        // 此处省略，由训练结束时一次性上传
    },
    
    /**
     * 切换训练状态
     */
    toggleTraining() {
        if (this.data.isTraining) {
            this.endTraining();
        } else {
            this.startTraining();
        }
    },
    
    /**
     * 开始训练
     */
    startTraining() {
        console.log("开始颂钵训练");
        
        // 设置开始时间
        const startTime = Date.now();
        
        // 开始计时器
        const timer = setInterval(() => {
            const seconds = Math.floor((Date.now() - startTime) / 1000);
            this.setData({
                trainingSeconds: seconds
            });
        }, 1000);
        
        this.setData({
            isTraining: true,
            trainingStartTime: startTime,
            trainingTimer: timer
        });
        
        // 加载今日训练数据
        this.loadTrainingDataFromDB();
    },
    
    /**
     * 结束训练
     */
    endTraining() {
        console.log("结束颂钵训练");
        
        // 停止计时器
        if (this.data.trainingTimer) {
            clearInterval(this.data.trainingTimer);
        }
        
        // 停止自动敲击（如果有）
        if (this.data.isAutoTapping) {
            this.stopAutoTap();
        }
        
        // 计算训练时长
        const trainingSeconds = this.data.trainingSeconds;
        
        this.setData({
            isTraining: false,
            trainingTimer: null,
            trainingStartTime: null
        });
        
        // 如果训练时间足够长，上传训练数据
        if (trainingSeconds > 10) {
            console.log(`上传训练数据：时长 ${trainingSeconds} 秒，敲击次数 ${this.data.count}`);
            this.uploadTrainingData(trainingSeconds);
        } else {
            console.log("训练时间太短，不上传数据");
        }
        
        // 弹出提示
        wx.showToast({
            title: `共训练${trainingSeconds}秒`,
            icon: 'none',
            duration: 2000
        });
    },
    
    /**
     * 上传训练数据到云数据库
     */
    uploadTrainingData(seconds) {
        const openId = app.globalData.userInfo?.openId;
        if (!openId) {
            console.log("用户未登录，无法上传训练数据");
            return;
        }
        
        const today = this.data.today;
        const db = app.globalData.db;
        const counts = this.data.count;
        
        // 首先查询是否存在今日记录
        db.collection("trainlog").where({
            openId: openId,
            date: today
        }).get().then(res => {
            console.log("检查今日记录结果:", res);
            
            if (res.data && res.data.length > 0) {
                // 有今日记录，更新
                const todayRecord = res.data[0];
                const recordId = todayRecord._id;
                
                // 计算新的总训练时间
                const oldSeconds = todayRecord.songboSeconds || 0;
                const oldCounts = todayRecord.songboCounts || 0;
                const newSeconds = oldSeconds + seconds;
                
                // 只有本地计数比云端大时才更新
                const newCounts = counts > oldCounts ? counts : oldCounts;
                
                // 更新记录
                db.collection("trainlog").doc(recordId).update({
                    data: {
                        songboCounts: newCounts,
                        songboSeconds: newSeconds,
                        updateTime: db.serverDate()
                    }
                }).then(() => {
                    console.log("更新训练记录成功");
                    
                    // 更新用户资料中的加速字段
                    this.updateUserInfoAcceleratedFields(newCounts, newSeconds);
                    
                }).catch(updateErr => {
                    console.error("更新训练记录失败:", updateErr);
                });
                
            } else {
                // 无今日记录，创建新记录
                db.collection("trainlog").add({
                    data: {
                        openId: openId,
                        date: today,
                        songboCounts: counts,
                        songboSeconds: seconds,
                        createTime: db.serverDate(),
                        updateTime: db.serverDate()
                    }
                }).then(() => {
                    console.log("创建训练记录成功");
                    
                    // 更新用户资料中的加速字段
                    this.updateUserInfoAcceleratedFields(counts, seconds);
                    
                }).catch(addErr => {
                    console.error("创建训练记录失败:", addErr);
                });
            }
            
        }).catch(err => {
            console.error("检查今日记录失败:", err);
        });
    },
    
    /**
     * 更新用户信息中的加速字段
     */
    updateUserInfoAcceleratedFields(counts, seconds) {
        const openId = app.globalData.userInfo?.openId;
        if (!openId) return;
        
        const db = app.globalData.db;
        
        // 获取用户信息
        db.collection("users").where({
            openId: openId
        }).get().then(res => {
            if (res.data && res.data.length > 0) {
                const userInfo = res.data[0];
                const userId = userInfo._id;
                
                // 计算新的总计值
                const oldTotalCounts = userInfo.totalSongboCounts || 0;
                const oldTotalSeconds = userInfo.totalSongboSeconds || 0;
                const newTotalCounts = oldTotalCounts + counts;
                const newTotalSeconds = oldTotalSeconds + seconds;
                
                // 更新用户信息
                db.collection("users").doc(userId).update({
                    data: {
                        totalSongboCounts: newTotalCounts,
                        totalSongboSeconds: newTotalSeconds,
                        updateTime: db.serverDate()
                    }
                }).then(() => {
                    console.log("更新用户加速字段成功");
                }).catch(updateErr => {
                    console.error("更新用户加速字段失败:", updateErr);
                });
            }
        }).catch(err => {
            console.error("获取用户信息失败:", err);
        });
    },
    
    /**
     * 播放颂钵敲击音效
     */
    playSound() {
        // 如果静音，则不播放音效
        if (this.data.isMuted) {
            console.log('颂钵音效未播放：静音模式已开启');
            return;
        }
        
        console.log('开始创建颂钵音频上下文...');
        const innerAudioContext = wx.createInnerAudioContext();
        innerAudioContext.autoplay = true;
        
        // 使用云存储地址
        const cloudFileID = 'cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/audio/songbo.wav';
        console.log('获取云文件临时链接:', cloudFileID);
        
        // 获取云文件临时链接
        wx.cloud.getTempFileURL({
            fileList: [cloudFileID],
            success: res => {
                console.log('获取临时链接成功:', res);
                const tempFileURL = res.fileList[0].tempFileURL;
                console.log('颂钵音频临时链接:', tempFileURL);
                
                // 使用临时链接播放
                innerAudioContext.src = tempFileURL;
                
                innerAudioContext.onCanplay(() => {
                    console.log('颂钵音频已准备好播放');
                });
                
                innerAudioContext.onPlay(() => {
                    console.log('颂钵音频开始播放');
                });
                
                innerAudioContext.onError((res) => {
                    console.error('颂钵音频播放失败:', res);
                    console.log('错误码:', res.errCode);
                    console.log('错误信息:', res.errMsg);
                });
            },
            fail: err => {
                console.error('获取临时链接失败:', err);
                
                // 如果获取临时链接失败，尝试直接从CDN访问
                const cdnURL = 'https://7368-shanmen-2g47tf5h9b090d06-1349502341.tcb.qcloud.la/audio/songbo.wav';
                console.log('尝试使用CDN链接:', cdnURL);
                
                innerAudioContext.src = cdnURL;
                
                innerAudioContext.onCanplay(() => {
                    console.log('颂钵音频(CDN)已准备好播放');
                });
                
                innerAudioContext.onPlay(() => {
                    console.log('颂钵音频(CDN)开始播放');
                });
                
                innerAudioContext.onError((res) => {
                    console.error('颂钵音频(CDN)播放失败:', res);
                });
            }
        });
    },
    
    /**
     * 显示设置模态框
     */
    showSettingsModal() {
        this.setData({
            showModal: true
        });
    },
    
    /**
     * 隐藏设置模态框
     */
    hideSettingsModal() {
        this.setData({
            showModal: false
        });
    },
    
    /**
     * 滑块值改变事件
     */
    sliderChange(e) {
        this.setData({
            interval: e.detail.value
        });
    },
    
    /**
     * 持续时间滑块值改变事件
     */
    durationChange(e) {
        this.setData({
            autoTapDuration: e.detail.value
        });
    },
    
    /**
     * 开始自动敲击
     */
    startAutoTap() {
        // 隐藏模态框
        this.hideSettingsModal();
        
        // 如果已经在自动敲击，先停止
        if (this.data.isAutoTapping) {
            this.stopAutoTap();
        }
        
        // 设置自动敲击状态
        this.setData({
            isAutoTapping: true
        });
        
        // 计算自动敲击应该持续的毫秒数
        const durationMs = this.data.autoTapDuration * 60 * 1000;
        
        // 设置定时器，按照间隔自动敲击
        const timer = setInterval(() => {
            this.tapSongbo();
        }, this.data.interval * 1000);
        
        // 设置结束计时器
        const endTimer = setTimeout(() => {
            this.stopAutoTap();
            
            // 显示提示
            wx.showToast({
                title: '自动敲击已完成',
                icon: 'none',
                duration: 2000
            });
        }, durationMs);
        
        // 保存计时器ID
        this.setData({
            autoTapTimer: timer,
            autoTapEndTimer: endTimer
        });
        
        // 显示提示
        wx.showToast({
            title: `已开始自动敲击，间隔${this.data.interval}秒，持续${this.data.autoTapDuration}分钟`,
            icon: 'none',
            duration: 2000
        });
    },
    
    /**
     * 停止自动敲击
     */
    stopAutoTap() {
        // 清除自动敲击定时器
        if (this.data.autoTapTimer) {
            clearInterval(this.data.autoTapTimer);
        }
        
        // 清除结束计时器
        if (this.data.autoTapEndTimer) {
            clearTimeout(this.data.autoTapEndTimer);
        }
        
        // 重置状态
        this.setData({
            isAutoTapping: false,
            autoTapTimer: null,
            autoTapEndTimer: null
        });
        
        console.log("自动敲击已停止");
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
        // 维护在线状态
        if (app.globalData.isLoggedIn && app.globalData.userInfo.openId) {
            const db = app.globalData.db;
            
            // 更新用户在线状态
            db.collection('userOnlineStatus').where({
                openId: app.globalData.userInfo.openId
            }).update({
                data: {
                    lastActiveTime: Date.now(),
                    lastPage: 'songbo'
                }
            });
        }
    },
    
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        // 如果用户正在训练，保存当前状态
        if (this.data.isTraining) {
            console.log("页面隐藏，保存训练状态");
            
            // 停止自动敲击（如果有）
            if (this.data.isAutoTapping) {
                this.stopAutoTap();
            }
            
            // 停止计时器
            if (this.data.trainingTimer) {
                clearInterval(this.data.trainingTimer);
            }
            
            // 上传当前训练数据
            const trainingSeconds = this.data.trainingSeconds;
            if (trainingSeconds > 10) {
                this.uploadTrainingData(trainingSeconds);
            }
            
            // 保存训练状态到本地存储
            wx.setStorageSync('songboTrainingState', {
                isTraining: true,
                count: this.data.count,
                totalCount: this.data.totalCount,
                trainingStartTime: this.data.trainingStartTime,
                trainingSeconds: this.data.trainingSeconds
            });
        }
        
        // 清除在线用户计数刷新定时器
        if (this.data.onlineCountTimer) {
            clearInterval(this.data.onlineCountTimer);
        }
    },
    
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        // 如果用户正在训练，结束训练
        if (this.data.isTraining) {
            console.log("页面卸载，结束训练");
            this.endTraining();
        }
        
        // 清除自动敲击定时器
        if (this.data.autoTapTimer) {
            clearInterval(this.data.autoTapTimer);
        }
        
        // 清除结束计时器
        if (this.data.autoTapEndTimer) {
            clearTimeout(this.data.autoTapEndTimer);
        }
        
        // 清除训练计时器
        if (this.data.trainingTimer) {
            clearInterval(this.data.trainingTimer);
        }
        
        // 清除在线用户计数刷新定时器
        if (this.data.onlineCountTimer) {
            clearInterval(this.data.onlineCountTimer);
        }
    },
    
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        console.log("用户下拉刷新");
        
        // 重新加载训练数据
        this.loadTrainingDataFromDB();
        
        // 获取最新的在线用户数量
        this.getOnlineUserCount();
        
        // 停止下拉刷新动画
        setTimeout(() => {
            wx.stopPullDownRefresh();
        }, 1000);
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
     * 切换静音状态
     */
    toggleMute() {
        const newMuted = !this.data.isMuted;
        
        this.setData({
            isMuted: newMuted
        });
        
        wx.showToast({
            title: newMuted ? '已静音' : '已开启声音',
            icon: 'none',
            duration: 1500
        });
    },
    
    /**
     * 更换随机背景
     */
    changeRandomBackground() {
        // 随机选择一个不同的背景
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
        } while (this.data.currentBackground === BACKGROUND_IMAGES[newIndex] && BACKGROUND_IMAGES.length > 1);
        
        this.setData({
            currentBackground: BACKGROUND_IMAGES[newIndex]
        });
    },
    
    /**
     * 显示上传离线训练模态框
     */
    showUploadModal() {
        this.setData({
            showUploadModal: true,
            offlineTrainingMinutes: '',
            offlineTapDuration: '',
            calculatedTapCount: 0
        });
    },
    
    /**
     * 隐藏上传离线训练模态框
     */
    hideUploadModal() {
        this.setData({
            showUploadModal: false
        });
    },
    
    /**
     * 训练时长输入事件
     */
    minutesInput(e) {
        const value = e.detail.value;
        
        this.setData({
            offlineTrainingMinutes: value
        });
        
        // 重新计算预计敲击次数
        if (value && this.data.offlineTapDuration) {
            this.calculateTapCount();
        }
    },
    
    /**
     * 单次敲击长度输入事件
     */
    tapDurationInput(e) {
        const value = e.detail.value;
        
        this.setData({
            offlineTapDuration: value
        });
        
        // 重新计算预计敲击次数
        if (value && this.data.offlineTrainingMinutes) {
            this.calculateTapCount();
        }
    },
    
    /**
     * 计算预计敲击次数
     */
    calculateTapCount() {
        const minutes = parseFloat(this.data.offlineTrainingMinutes);
        const tapDuration = parseFloat(this.data.offlineTapDuration);
        
        if (minutes > 0 && tapDuration > 0) {
            // 计算公式：训练时长(分钟) * 60 / 单次敲击长度(秒)
            const count = Math.floor(minutes * 60 / tapDuration);
            
            this.setData({
                calculatedTapCount: count
            });
        }
    },
    
    /**
     * 上传离线训练记录
     */
    uploadOfflineTraining() {
        const minutes = parseFloat(this.data.offlineTrainingMinutes);
        const tapDuration = parseFloat(this.data.offlineTapDuration);
        
        if (isNaN(minutes) || minutes <= 0) {
            wx.showToast({
                title: '请输入有效的训练时长',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        
        if (isNaN(tapDuration) || tapDuration <= 0) {
            wx.showToast({
                title: '请输入有效的敲击长度',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        
        // 计算敲击次数和训练秒数
        const tapCount = Math.floor(minutes * 60 / tapDuration);
        const seconds = Math.floor(minutes * 60);
        
        // 隐藏模态框
        this.hideUploadModal();
        
        // 显示上传中提示
        wx.showLoading({
            title: '上传中...',
            mask: true
        });
        
        // 上传训练数据
        this.uploadTrainingData(seconds);
        
        // 更新本地显示的计数
        this.setData({
            count: this.data.count + tapCount,
            totalCount: this.data.totalCount + tapCount
        });
        
        // 延时关闭加载提示
        setTimeout(() => {
            wx.hideLoading();
            
            wx.showToast({
                title: '上传成功',
                icon: 'success',
                duration: 1500
            });
        }, 1500);
    },
    
    /**
     * 跳转到反馈页面
     */
    goToFeedback() {
        wx.navigateTo({
            url: '/pages/feedback/feedback'
        });
    },
    
    /**
     * 获取当前在线用户数量
     */
    getOnlineUserCount() {
        const db = app.globalData.db;
        
        // 查询 userOnlineStatus 集合中在线的用户
        db.collection('userOnlineStatus').where({
            lastActiveTime: db.command.gt(Date.now() - 60000)
        }).count().then(res => {
            console.log('[在线状态] 当前在线用户数量:', res.total);
            
            this.setData({
                onlineUserCount: res.total
            });
        }).catch(err => {
            console.error('[在线状态] 获取在线用户数量失败:', err);
        });
    },
    
    /**
     * 直接查询今日记录
     */
    loadTodayRecordDirectly() {
        const openId = app.globalData.userInfo?.openId;
        if (!openId) {
            console.log("未登录或openId不存在");
            return;
        }
        
        const today = this.data.today;
        const db = app.globalData.db;
        
        // 直接按日期查询今日记录
        db.collection("trainlog").where({
            openId: openId,
            date: today
        }).get().then(res => {
            console.log("按日期直接查询今日记录结果:", res);
            
            let todayCount = 0;
            
            if (res.data && res.data.length > 0) {
                const todayRecord = res.data[0];
                todayCount = todayRecord.songboCounts || 0;
                console.log("今日颂钵记录:", todayCount);
            } else {
                console.log("没有找到今日记录");
            }
            
            // 更新页面数据
            this.setData({
                count: todayCount
            });
        }).catch(err => {
            console.error("查询今日记录失败:", err);
            // 使用本地缓存数据
            this.loadFromLocalStorage();
        });
    }
}) 