const app = getApp();
import { BACKGROUND_IMAGES } from '../profileshanmen/constants/index';

Page({
    /**
     * 页面的初始数据
     */
    data: {
        count: 0,           // 今日敲击计数
        totalCount: 0,      // 总敲击计数
        isAnimating: false, // 木鱼动画状态
        showModal: false,   // 模态框显示状态
        interval: 1.0,      // 自动敲击间隔（秒）
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
        calculatedTapCount: 0,       // 计算得出的敲击次数
        
        // 在线用户数量
        onlineUserCount: 0,           // 当前在线用户数量
        onlineCountTimer: null,       // 在线用户数量刷新定时器
        
        // 音频临时文件路径
        muyuAudioPath: null,          // 木鱼音频临时文件路径
        isAudioLoaded: false,         // 音频是否已加载完成
        
        // 屏幕常亮状态
        keepScreenOn: false           // 是否保持屏幕常亮
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
        
        // 预加载音频文件
        this.preloadAudio();
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
            let todaySeconds = 0;
            
            if (res.data && res.data.length > 0) {
                const todayRecord = res.data[0];
                todayCount = todayRecord.muyuCounts || 0;
                todaySeconds = todayRecord.muyuSeconds || 0;
                console.log("今日木鱼记录:", todayCount, "次,", todaySeconds, "秒");
                
                // 更新全局变量中的今日训练时长
                const todayMinutes = Math.ceil(todaySeconds / 60);
                app.globalData.muyuTodayMinutes = todayMinutes;
                console.log(`[木鱼数据加载] 设置全局变量今日训练时长: ${todayMinutes}分钟`);
            } else {
                console.log("没有找到今日记录，使用默认值0");
                // 重置全局变量
                app.globalData.muyuTodayMinutes = 0;
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
                    totalCount += record.muyuCounts || 0;
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
            const muyuRecords = wx.getStorageSync('muyuRecords') || {};
            let totalCount = 0;
            for (const date in muyuRecords) {
                totalCount += muyuRecords[date];
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
        const muyuRecords = wx.getStorageSync('muyuRecords') || {};
        const todayCount = muyuRecords[this.data.today] || 0;
        
        // 计算总计数
        let totalCount = 0;
        for (const date in muyuRecords) {
            totalCount += muyuRecords[date];
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
        const muyuRecords = wx.getStorageSync('muyuRecords') || {};
        muyuRecords[this.data.today] = todayCount;
        wx.setStorageSync('muyuRecords', muyuRecords);
        
        // 更新全局数据
        if (app.globalData) {
            app.globalData.muyuRecords = muyuRecords;
            app.globalData.muyuTodayCount = todayCount;
            app.globalData.muyuTotalCount = totalCount;
            
            // 更新用户信息中的木鱼数据
            app.globalData.userInfo.muyuTodayCount = todayCount;
            app.globalData.userInfo.muyuTotalCount = totalCount;
        }
    },

    /**
     * 敲击木鱼
     */
    tapMuyu() {
        console.log('======= 木鱼敲击函数 tapMuyu 开始执行 =======');
        
        // 如果没有开始训练，则不允许敲击
        if (!this.data.isTraining) {
            console.log('未开始训练，无法敲击木鱼');
            wx.showToast({
                title: '请先点击开始训练',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        
        console.log('木鱼敲击有效，准备更新计数');
        
        // 更新今日计数
        const newCount = this.data.count + 1;
        const newTotalCount = this.data.totalCount + 1;
        
        this.setData({
            count: newCount,
            totalCount: newTotalCount,
            isAnimating: true
        });
        
        console.log('木鱼计数已更新 - 今日:', newCount, '总计:', newTotalCount);
        
        // 保存计数到缓存
        this.saveCountToStorage(newCount);
        
        console.log('准备播放木鱼音效...');
        // 播放音效
        this.playSound();
        console.log('木鱼音效播放函数已调用');
        
        // 动画效果
        setTimeout(() => {
            this.setData({
                isAnimating: false
            });
            console.log('木鱼动画效果已结束');
        }, 100);
        
        console.log('======= 木鱼敲击函数执行结束 =======');
    },
    
    /**
     * 保存计数到缓存
     */
    saveCountToStorage(count) {
        // 读取现有记录
        const muyuRecords = wx.getStorageSync('muyuRecords') || {};
        
        // 更新今日记录
        muyuRecords[this.data.today] = count;
        
        // 保存回缓存
        wx.setStorageSync('muyuRecords', muyuRecords);
        
        // 同时更新全局数据，方便"我的"页面读取
        if (app.globalData) {
            app.globalData.muyuRecords = muyuRecords;
            app.globalData.muyuTodayCount = count;
            app.globalData.muyuTotalCount = this.data.totalCount;
        }
        // 将今日敲击记录放到用户信息中
        app.globalData.userInfo.muyuTodayCount = count;
        app.globalData.userInfo.muyuTotalCount = this.data.totalCount;
        
        // 注意：不再每次敲击时上传数据库，而是在结束训练时一次性上传
    },
    
    /**
     * 切换训练状态（开始/结束训练）
     */
    toggleTraining() {
        if (!this.data.isTraining) {
            // 开始训练
            this.startTraining();
        } else {
            // 结束训练
            this.endTraining();
        }
    },

    /**
     * 开始训练
     */
    startTraining() {
        const now = new Date();
        
        // 设置训练状态和开始时间
        this.setData({
            isTraining: true,
            trainingStartTime: now,
            trainingSeconds: 0
        });

        // 显示提示
        wx.showToast({
            title: '训练开始',
            icon: 'success',
            duration: 1500
        });

        // 设置计时器，每秒更新训练时长
        const timer = setInterval(() => {
            const currentSeconds = Math.floor((new Date() - this.data.trainingStartTime) / 1000);
            this.setData({
                trainingSeconds: currentSeconds
            });
        }, 1000);

        this.setData({
            trainingTimer: timer
        });
    },

    /**
     * 结束训练并上传数据
     */
    endTraining() {
        // 停止计时器
        if (this.data.trainingTimer) {
            clearInterval(this.data.trainingTimer);
        }

        // 如果自动敲击还在运行，停止它
        if (this.data.isAutoTapping) {
            this.stopAutoTap();
        }

        // 保存最终训练时长
        const finalSeconds = this.data.trainingSeconds;
        const finalMinutes = Math.ceil(finalSeconds / 60);

        // 更新全局变量中的今日训练时长
        console.log(`[木鱼训练结束] 本次训练时长: ${finalSeconds}秒 (${finalMinutes}分钟)`);
        
        // 从全局变量获取之前的今日时长，如果没有则为0
        const previousTodayMinutes = app.globalData.muyuTodayMinutes || 0;
        const newTodayMinutes = previousTodayMinutes + finalMinutes;
        
        // 更新全局变量
        app.globalData.muyuTodayMinutes = newTodayMinutes;
        console.log(`[木鱼训练结束] 今日累计训练时长: ${previousTodayMinutes} + ${finalMinutes} = ${newTodayMinutes}分钟`);

        // 重置训练状态
        this.setData({
            isTraining: false,
            trainingTimer: null
        });

        // 上传训练数据到数据库
        this.uploadTrainingData(finalSeconds);

        // 显示提示
        wx.showToast({
            title: '训练结束',
            icon: 'success',
            duration: 2000
        });
    },

    /**
     * 上传训练数据到数据库
     */
    uploadTrainingData(seconds) {
        // 获取今天的日期
        const today = this.getTodayDateString();
        // 获取数据库操作命令对象
        const _ = wx.cloud.database().command;

        // 首先查看数据库中是否有该用户openId今日的训练记录
        app.globalData.db.collection("trainlog").where({
            openId: app.globalData.userInfo.openId,
            date: today
        }).get().then(res => {
            if (res.data.length > 0) {
                // 有今日的训练记录，直接更新云端数据为本地数据
                console.log("in uploadTrainingData 有今日的训练记录，直接更新云端数据");
                const localCount = this.data.count;
                
                app.globalData.db.collection("trainlog").where({
                    openId: app.globalData.userInfo.openId,
                    date: today
                }).update({
                    data: {
                        muyuCounts: localCount,
                        muyuSeconds: _.inc(seconds) // 累加训练秒数
                    }
                }).then(res => {
                    console.log("更新训练记录成功:", res);
                    
                    // 更新userinfo表中的加速字段
                    this.updateUserInfoAcceleratedFields(localCount, seconds);
                    
                    // 更新后重新从数据库获取最新数据
                    this.loadTrainingDataFromDB();
                }).catch(err => {
                    console.error("更新训练记录失败:", err);
                });
            } else {
                // 没有今日的训练记录，创建新记录
                console.log("in uploadTrainingData 没有今日的训练记录，创建新记录");
                app.globalData.db.collection("trainlog").add({
                    data: {
                        openId: app.globalData.userInfo.openId,
                        date: today,
                        muyuCounts: this.data.count,
                        muyuSeconds: seconds
                    }
                }).then(res => {
                    console.log("添加训练记录成功:", res);
                    
                    // 更新userinfo表中的加速字段
                    this.updateUserInfoAcceleratedFields(this.data.count, seconds);
                    
                    // 添加后重新从数据库获取最新数据
                    this.loadTrainingDataFromDB();
                }).catch(err => {
                    console.error("添加训练记录失败:", err);
                });
            }
        });
    },
    
    /**
     * 更新userinfo表中的加速字段
     */
    updateUserInfoAcceleratedFields(counts, seconds) {
        // 获取数据库操作命令对象
        const _ = wx.cloud.database().command;
        
        // 更新userinfo表中的加速字段
        app.globalData.db.collection("userinfo").where({
            openId: app.globalData.userInfo.openId
        }).update({
            data: {
                accumulateMuyu: _.inc(counts),
                accumulateMuyuTime: _.inc(seconds),
                accumulateSongbo: _.inc(0),         // 确保颂钵字段存在
                accumulateSongboTime: _.inc(0),     // 确保颂钵时间字段存在
                lastUpdateTime: new Date().getTime()
            }
        }).then(res => {
            console.log("更新userinfo加速字段成功:", res);
            // 引入updateUserLevel函数
            const { updateUserLevel } = require('../profileshanmen/utils/index');
            // 更新用户段位
            updateUserLevel(app.globalData.userInfo.openId, app.globalData.db).then(updateRes => {
                console.log("木鱼页面更新用户段位成功:", updateRes);
            }).catch(err => {
                console.error("木鱼页面更新用户段位失败:", err);
            });
        }).catch(err => {
            console.error("更新userinfo加速字段失败:", err);
        });
    },
    
    /**
     * 播放木鱼敲击音效
     */
    playSound() {
        console.log('======= 木鱼音频函数开始执行(pages/muyu) =======');
        
        // 如果静音，则不播放音效
        if (this.data.isMuted) {
            console.log('木鱼音效未播放：静音模式已开启');
            return;
        }
        
        try {
            // 检查是否已加载音频
            if (!this.data.isAudioLoaded || !this.data.muyuAudioPath) {
                console.log('木鱼音频尚未加载完成，尝试重新加载...');
                this.preloadAudio(); // 尝试重新加载
                return;
            }
            
            // 使用已下载的临时文件播放
            console.log('使用预加载的音频文件:', this.data.muyuAudioPath);
            
            // 创建音频上下文
            console.log('创建木鱼音频上下文...');
            const innerAudioContext = wx.createInnerAudioContext({useWebAudioImplement: false});
            console.log('木鱼音频上下文创建成功');
            
            // 设置音频源为已下载的临时文件路径
            innerAudioContext.src = this.data.muyuAudioPath;
            innerAudioContext.autoplay = true;
            
            // 添加事件监听器
            innerAudioContext.onCanplay(() => {
                console.log('木鱼音频已准备好播放 onCanplay');
            });
            
            innerAudioContext.onPlay(() => {
                console.log('木鱼音频开始播放 onPlay');
            });
            
            innerAudioContext.onError((err) => {
                console.error('木鱼音频播放错误:', err.errMsg);
                console.error('木鱼音频错误码:', err.errCode);
                
                // 如果播放失败，尝试重新加载音频
                this.preloadAudio();
            });
            
            // 尝试播放
            console.log('尝试播放木鱼音频...');
            innerAudioContext.play();
            console.log('木鱼音频 play() 方法调用完成');
        } catch (e) {
            console.error('木鱼音频处理出现异常:', e);
        }
        
        console.log('======= 木鱼音频函数执行结束 =======');
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
     * 滑块改变事件 - 敲击间隔
     */
    sliderChange(e) {
        this.setData({
            interval: e.detail.value
        });
    },

    /**
     * 滑块改变事件 - 自动敲击时长
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
        
        // 如果已经在自动敲击中，先清除定时器
        if (this.data.isAutoTapping) {
            this.stopAutoTap();
        }
        
        // 设置自动敲击状态
        this.setData({
            isAutoTapping: true
        });
        
        // 显示提示
        wx.showToast({
            title: `自动敲击已开启，将持续${this.data.autoTapDuration}分钟`,
            icon: 'none',
            duration: 2000
        });
        
        // 设置定时器，定期自动敲击
        const tapTimer = setInterval(() => {
            this.tapMuyu();
        }, this.data.interval * 1000); // 转换为毫秒
        
        // 设置结束定时器，在指定时间后自动停止
        const endTimer = setTimeout(() => {
            this.stopAutoTap();
            wx.showToast({
                title: '自动敲击已完成',
                icon: 'success',
                duration: 1500
            });
        }, this.data.autoTapDuration * 60 * 1000); // 转换为毫秒
        
        // 保存定时器ID
        this.setData({
            autoTapTimer: tapTimer,
            autoTapEndTimer: endTimer
        });
    },
    
    /**
     * 停止自动敲击
     */
    stopAutoTap() {
        // 清除敲击定时器
        if (this.data.autoTapTimer) {
            clearInterval(this.data.autoTapTimer);
        }
        
        // 清除结束定时器
        if (this.data.autoTapEndTimer) {
            clearTimeout(this.data.autoTapEndTimer);
        }
        
        this.setData({
            isAutoTapping: false,
            autoTapTimer: null,
            autoTapEndTimer: null
        });
        
        wx.showToast({
            title: '自动敲击已停止',
            icon: 'none',
            duration: 1500
        });
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
        // 每次显示页面时，直接调用刷新按钮绑定的函数获取今日记录
        this.loadTodayRecordDirectly();
        
        // 确保页面恢复时是初始状态（只有开始训练按钮）
        this.setData({
            isTraining: false,
            isAutoTapping: false,
            trainingStartTime: null,
            trainingSeconds: 0,
            trainingTimer: null,
            autoTapTimer: null,
            autoTapEndTimer: null
        });
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        // 页面隐藏时，确保清除所有定时器
        if (this.data.autoTapTimer) {
            clearInterval(this.data.autoTapTimer);
        }
        if (this.data.autoTapEndTimer) {
            clearTimeout(this.data.autoTapEndTimer);
        }
        if (this.data.trainingTimer) {
            clearInterval(this.data.trainingTimer);
        }
        
        // 如果正在训练，结束训练并上传数据
        if (this.data.isTraining) {
            // 保存最终训练时长
            const finalSeconds = this.data.trainingSeconds;

            // 重置训练状态
            this.setData({
                isTraining: false,
                trainingTimer: null,
                isAutoTapping: false
            });

            // 停止自动敲击如果正在进行
            if (this.data.isAutoTapping) {
                this.stopAutoTap();
            }

            // 上传训练数据到数据库
            this.uploadTrainingData(finalSeconds);
        }
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        // 页面卸载时，确保清除所有定时器
        if (this.data.autoTapTimer) {
            clearInterval(this.data.autoTapTimer);
        }
        if (this.data.autoTapEndTimer) {
            clearTimeout(this.data.autoTapEndTimer);
        }
        if (this.data.trainingTimer) {
            clearInterval(this.data.trainingTimer);
        }
        
        // 如果正在训练，结束训练并上传数据
        if (this.data.isTraining) {
            // 保存最终训练时长
            const finalSeconds = this.data.trainingSeconds;

            // 重置训练状态
            this.setData({
                isTraining: false,
                trainingTimer: null,
                isAutoTapping: false
            });

            // 停止自动敲击如果正在进行
            if (this.data.isAutoTapping) {
                this.stopAutoTap();
            }

            // 上传训练数据到数据库
            this.uploadTrainingData(finalSeconds);
        }
        
        // 清除在线用户数量刷新定时器
        if (this.data.onlineCountTimer) {
            clearInterval(this.data.onlineCountTimer);
        }
        
        // 关闭屏幕常亮
        if (this.data.keepScreenOn) {
            wx.setKeepScreenOn({
                keepScreenOn: false
            });
        }
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        // 从云端重新获取最新数据
        this.loadTrainingDataFromDB();
        
        // 显示加载提示
        wx.showToast({
            title: '刷新成功',
            icon: 'success',
            duration: 1000
        });
        
        // 停止下拉刷新动画
        wx.stopPullDownRefresh();
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
        this.setData({
            isMuted: !this.data.isMuted
        });
        
        wx.showToast({
            title: this.data.isMuted ? '已静音' : '已开启声音',
            icon: 'none',
            duration: 1000
        });
    },

    /**
     * 切换随机背景图片
     */
    changeRandomBackground() {
        // 获取当前背景索引
        const currentIndex = BACKGROUND_IMAGES.indexOf(this.data.currentBackground);
        // 计算下一个背景索引（循环访问）
        const nextIndex = (currentIndex + 1) % BACKGROUND_IMAGES.length;
        // 设置新背景
        this.setData({
            currentBackground: BACKGROUND_IMAGES[nextIndex]
        });
        
        // 播放背景切换的轻微提示音（可选）
       // if (!this.data.isMuted) {
        //    const bgChangeAudio = wx.createInnerAudioContext();
        //    bgChangeAudio.src = 'cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/click.mp3';
        //    bgChangeAudio.play();
        //}
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
     * 训练时长输入事件处理
     */
    minutesInput(e) {
        const minutes = e.detail.value;
        this.setData({
            offlineTrainingMinutes: minutes
        });
        
        // 如果敲击长度也已输入，计算敲击次数
        if (this.data.offlineTapDuration) {
            this.calculateTapCount();
        }
    },
    
    /**
     * 单次敲击长度输入事件处理
     */
    tapDurationInput(e) {
        const duration = e.detail.value;
        this.setData({
            offlineTapDuration: duration
        });
        
        // 如果训练时长也已输入，计算敲击次数
        if (this.data.offlineTrainingMinutes) {
            this.calculateTapCount();
        }
    },
    
    /**
     * 计算敲击次数
     */
    calculateTapCount() {
        const minutes = parseFloat(this.data.offlineTrainingMinutes);
        const tapDuration = parseFloat(this.data.offlineTapDuration);
        
        if (minutes > 0 && tapDuration > 0) {
            // 计算可能的敲击次数: 训练总秒数 / 每次敲击秒数
            const totalSeconds = minutes * 60;
            const tapCount = Math.floor(totalSeconds / tapDuration);
            
            this.setData({
                calculatedTapCount: tapCount
            });
        }
    },
    
    /**
     * 上传离线训练数据
     */
    uploadOfflineTraining() {
        const minutes = parseFloat(this.data.offlineTrainingMinutes);
        const tapDuration = parseFloat(this.data.offlineTapDuration);
        
        // 验证输入数据
        if (!minutes || minutes <= 0) {
            wx.showToast({
                title: '请输入有效的训练时长',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        
        if (!tapDuration || tapDuration <= 0) {
            wx.showToast({
                title: '请输入有效的敲击长度',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        
        const totalSeconds = minutes * 60;
        const tapCount = Math.floor(totalSeconds / tapDuration);
        
        // 隐藏模态框
        this.hideUploadModal();
        
        // 显示上传中提示
        wx.showLoading({
            title: '上传中...',
            mask: true
        });
        
        // 更新本地敲击计数
        const newCount = this.data.count + tapCount;
        const newTotalCount = this.data.totalCount + tapCount;
        
        this.setData({
            count: newCount,
            totalCount: newTotalCount
        });
        
        // 保存到本地存储
        this.saveCountToStorage(newCount);
        
        // 上传到服务器
        this.uploadTrainingData(totalSeconds);
        
        // 隐藏加载提示并显示成功消息
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
                title: '离线记录已上传',
                icon: 'success',
                duration: 2000
            });
        }, 1000);
    },

    /**
     * 获取当前在线用户数量
     */
    getOnlineUserCount() {
        const db = app.globalData.db;
        const currentTime = Date.now();
        const oneMinuteAgo = currentTime - 60000;
        
        console.log('🔍 [木鱼页面-在线统计] 开始获取在线用户数量...');
        console.log(`⏰ [木鱼页面-在线统计] 当前时间: ${new Date(currentTime).toLocaleString()}`);
        console.log(`⏰ [木鱼页面-在线统计] 一分钟前: ${new Date(oneMinuteAgo).toLocaleString()}`);
        
        // 查询 userOnlineStatus 集合中在线的用户
        db.collection('userOnlineStatus').where({
            lastActiveTime: db.command.gt(oneMinuteAgo)
        }).count().then(res => {
            console.log(`📊 [木鱼页面-在线统计] 查询结果 - 在线用户数量: ${res.total}`);
            
            this.setData({
                onlineUserCount: res.total
            });
            
            // 获取详细的在线用户信息用于调试
            db.collection('userOnlineStatus').where({
                lastActiveTime: db.command.gt(oneMinuteAgo)
            }).get().then(detailRes => {
                console.log(`📋 [木鱼页面-在线统计] 在线用户详细信息 (${detailRes.data.length}个):`);
                detailRes.data.forEach((user, index) => {
                    const timeDiff = currentTime - user.lastActiveTime;
                    console.log(`   ${index + 1}. 用户ID: ${user.openId}, 最后活跃: ${Math.floor(timeDiff/1000)}秒前, 状态: ${user.isOnline ? '在线' : '离线'}`);
                });
                
                // 检查是否有状态不一致的情况
                const inconsistentUsers = detailRes.data.filter(user => !user.isOnline);
                if (inconsistentUsers.length > 0) {
                    console.log(`⚠️ [木鱼页面-在线统计] 发现${inconsistentUsers.length}个用户状态不一致（活跃时间在1分钟内但状态标记为离线）`);
                }
            }).catch(err => {
                console.error('❌ [木鱼页面-在线统计] 获取详细信息失败:', err);
            });
            
        }).catch(err => {
            console.error('❌ [木鱼页面-在线统计] 获取在线用户数量失败:', err);
        });
    },

    /**
     * 直接查询今日记录
     */
    loadTodayRecordDirectly() {
        const openId = app.globalData.userInfo.openId;
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
                todayCount = todayRecord.muyuCounts || 0;
                console.log("今日木鱼记录:", todayCount);
            } else {
                console.log("没有找到今日记录");
            }
            
            // 更新页面数据
            this.setData({
                count: todayCount
            });
            
            // 计算总计数
            this.calculateTotalCount();
            
        }).catch(err => {
            console.error("查询今日记录失败:", err);
            // 使用本地缓存数据
            this.loadFromLocalStorage();
        });
    },

    /**
     * 跳转到反馈页面
     */
    goToFeedback: function() {
        wx.navigateTo({
            url: `/pages/feedback/feedback?background=${encodeURIComponent(this.data.currentBackground)}`
        });
    },

    /**
     * 预加载音频文件
     */
    preloadAudio() {
        console.log('开始预加载木鱼音频...');
        wx.cloud.downloadFile({
            fileID: 'cloud://shanmen-2g47tf5h9b090d06.7368-shanmen-2g47tf5h9b090d06-1349502341/audio/muyu.wav',
            success: res => {
                // 下载成功，保存临时文件路径
                const tempFilePath = res.tempFilePath;
                console.log('木鱼音频预加载成功，临时文件路径:', tempFilePath);
                
                this.setData({
                    muyuAudioPath: tempFilePath,
                    isAudioLoaded: true
                });
                
                // 预创建音频上下文以备用
                this.preCreateAudioContext();
            },
            fail: err => {
                console.error('木鱼音频预加载失败:', err);
                wx.showToast({
                    title: '音频加载失败',
                    icon: 'none',
                    duration: 1500
                });
            }
        });
    },
    
    /**
     * 预创建音频上下文
     */
    preCreateAudioContext() {
        try {
            console.log('预创建木鱼音频上下文...');
            // 可以在这里预创建音频上下文，但不播放
            // 当前微信小程序的音频API可能不支持持久化的音频上下文，所以这里暂时留空
        } catch (e) {
            console.error('预创建木鱼音频上下文失败:', e);
        }
    },

    /**
     * 切换屏幕常亮状态
     */
    toggleKeepScreenOn() {
        const newState = !this.data.keepScreenOn;
        
        // 设置屏幕常亮状态
        wx.setKeepScreenOn({
            keepScreenOn: newState,
            success: () => {
                this.setData({
                    keepScreenOn: newState
                });
                
                wx.showToast({
                    title: newState ? '屏幕常亮已开启' : '屏幕常亮已关闭',
                    icon: 'none',
                    duration: 1500
                });
            },
            fail: (err) => {
                console.error('设置屏幕常亮状态失败:', err);
                wx.showToast({
                    title: '设置失败，请重试',
                    icon: 'none',
                    duration: 1500
                });
            }
        });
    }
}) 