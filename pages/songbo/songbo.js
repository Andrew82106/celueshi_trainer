// pages/songbo/songbo.js
const app = getApp();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        count: 0,           // 今日敲击计数
        totalCount: 0,      // 总敲击计数
        isAnimating: false, // 颂钵动画状态
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
        autoTapEndTimer: null // 自动敲击结束计时器
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
        
        // 从数据库加载颂钵训练数据
        this.loadTrainingDataFromDB();
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
        // 获取openId，如果没有登录则使用本地缓存
        const openId = app.globalData.userInfo.openId;
        if (!openId) {
            console.log("未登录或openId不存在，使用本地缓存");
            this.loadFromLocalStorage();
            return;
        }
        
        const today = this.data.today;
        const db = app.globalData.db;
        
        // 查询数据库获取所有训练记录
        db.collection("trainlog").where({
            openId: openId
        }).get().then(res => {
            console.log("获取训练记录成功:", res);
            
            if (res.data && res.data.length > 0) {
                // 计算总计数和今日计数
                let totalCount = 0;
                let todayCount = 0;
                
                // 遍历所有训练记录
                res.data.forEach(record => {
                    // 累计总敲击次数
                    totalCount += record.songboCounts || 0;
                    
                    // 如果是今天的记录，设置今日计数
                    if (record.date === today) {
                        todayCount = record.songboCounts || 0;
                        
                        // 比较远端数据和本地缓存数据，取最大值
                        const localRecords = wx.getStorageSync('songboRecords') || {};
                        const localTodayCount = localRecords[today] || 0;
                        
                        if (localTodayCount > todayCount) {
                            // 本地数据大于远端数据，更新远端数据
                            console.log("本地数据大于远端数据，更新远端数据");
                            todayCount = localTodayCount;
                            
                            // 更新远端数据库
                            db.collection("trainlog").where({
                                openId: openId,
                                date: today
                            }).update({
                                data: {
                                    songboCounts: todayCount
                                }
                            }).then(updateRes => {
                                console.log("远端数据更新成功:", updateRes);
                            }).catch(updateErr => {
                                console.error("远端数据更新失败:", updateErr);
                            });
                        }
                    }
                });
                
                // 更新页面数据
                this.setData({
                    count: todayCount,
                    totalCount: totalCount
                });
                
                // 同时更新全局数据和本地缓存，保持一致
                this.updateGlobalAndLocalData(todayCount, totalCount);
            } else {
                console.log("没有找到训练记录，使用默认值");
                
                // 检查本地是否有今日记录
                const localRecords = wx.getStorageSync('songboRecords') || {};
                const localTodayCount = localRecords[today] || 0;
                
                if (localTodayCount > 0) {
                    // 本地有今日记录，但远端没有，创建远端记录
                    console.log("本地有今日记录，但远端没有，创建远端记录");
                    db.collection("trainlog").add({
                        data: {
                            openId: openId,
                            date: today,
                            songboCounts: localTodayCount,
                            songboSeconds: 0
                        }
                    }).then(addRes => {
                        console.log("创建远端记录成功:", addRes);
                    }).catch(addErr => {
                        console.error("创建远端记录失败:", addErr);
                    });
                    
                    // 设置页面显示
                    this.setData({
                        count: localTodayCount,
                        totalCount: localTodayCount
                    });
                } else {
                    // 本地和远端都没有记录
                    this.setData({
                        count: 0,
                        totalCount: 0
                    });
                }
                
                // 同时更新全局数据和本地缓存，保持一致
                this.updateGlobalAndLocalData(this.data.count, this.data.totalCount);
            }
        }).catch(err => {
            console.error("获取训练记录失败:", err);
            // 出错时使用本地缓存数据
            this.loadFromLocalStorage();
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
            
            // 更新用户信息中的颂钵数据
            app.globalData.userInfo.songboTodayCount = todayCount;
            app.globalData.userInfo.songboTotalCount = totalCount;
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
        
        // 保存计数到缓存
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
     * 保存计数到缓存
     */
    saveCountToStorage(count) {
        // 读取现有记录
        const songboRecords = wx.getStorageSync('songboRecords') || {};
        
        // 更新今日记录
        songboRecords[this.data.today] = count;
        
        // 保存回缓存
        wx.setStorageSync('songboRecords', songboRecords);
        
        // 同时更新全局数据，方便"我的"页面读取
        if (app.globalData) {
            app.globalData.songboRecords = songboRecords;
            app.globalData.songboTodayCount = count;
            app.globalData.songboTotalCount = this.data.totalCount;
        }

        // 将今日敲击记录放到用户信息中
        app.globalData.userInfo.songboTodayCount = count;
        app.globalData.userInfo.songboTotalCount = this.data.totalCount;
        
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
                // 有今日的训练记录，对比远端和本地数据，取最大值
                console.log("in uploadTrainingData 有今日的训练记录，比较远端和本地数据");
                const remoteCount = res.data[0].songboCounts || 0;
                const localCount = this.data.count;
                
                // 取本地和远端的最大值
                const finalCount = Math.max(remoteCount, localCount);
                
                // 更新本地显示
                if (finalCount > localCount) {
                    this.setData({
                        count: finalCount
                    });
                    // 同步更新本地存储
                    this.saveCountToStorage(finalCount);
                }
                
                app.globalData.db.collection("trainlog").where({
                    openId: app.globalData.userInfo.openId,
                    date: today
                }).update({
                    data: {
                        songboCounts: finalCount,
                        songboSeconds: _.inc(seconds) // 累加训练秒数
                    }
                }).then(res => {
                    console.log("更新训练记录成功:", res);
                    
                    // 更新后重新从数据库获取最新数据
                    this.loadTrainingDataFromDB();
                }).catch(err => {
                    console.error("更新训练记录失败:", err);
                    wx.showToast({
                        title: '上传失败',
                        icon: 'none',
                        duration: 1500
                    });
                });
            } else {
                // 没有今日的训练记录，创建新记录
                console.log("in uploadTrainingData 没有今日的训练记录，创建新记录");
                app.globalData.db.collection("trainlog").add({
                    data: {
                        openId: app.globalData.userInfo.openId,
                        date: today,
                        songboCounts: this.data.count,
                        songboSeconds: seconds
                    }
                }).then(res => {
                    console.log("添加训练记录成功:", res);
                    
                    // 添加后重新从数据库获取最新数据
                    this.loadTrainingDataFromDB();
                }).catch(err => {
                    console.error("添加训练记录失败:", err);
                });
            }
        });
    },
    
    /**
     * 播放颂钵敲击音效
     */
    playSound() {
        const innerAudioContext = wx.createInnerAudioContext();
        innerAudioContext.autoplay = true;
        
        // 颂钵音效路径
        innerAudioContext.src = '/assets/audio/songbo.wav';
        
        innerAudioContext.onError((res) => {
            console.log('音频播放失败：', res);
            // 当音频无法播放时，不阻止其他功能正常运行
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
            this.tapSongbo();
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
        // 每次显示页面时，从数据库重新加载最新数据
        this.loadTrainingDataFromDB();
        
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

    }
}) 