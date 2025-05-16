// pages/schulte-table/schulte-table.js
const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        isTraining: false,
        sizeRange: [3,4,5,6,7,8,9,10],
        selectedSize: 5,
        numberMatrix: [],
        currentNumber: 1,
        errorCount: 0,
        startTime: null,
        timeElapsed: 0,
        timer: null,
        gridSize: 5, // 新增gridSize用于动态样式
        isGuest: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        const app = getApp();
        this.setData({
            isGuest: app.globalData.isGuest || false
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

    onSizeChange(e) {
        this.setData({ selectedSize: this.data.sizeRange[e.detail.value] })
    },

    startTraining() {
        const size = this.data.selectedSize
        const numbers = Array.from({length: size*size}, (_, i) => ({
            num: i + 1,
            status: '' // 包含状态字段
        }))
        const shuffled = numbers.sort(() => Math.random() - 0.5)
        
        this.setData({
            isTraining: true,
            numberMatrix: shuffled,
            currentNumber: 1,
            errorCount: 0,
            startTime: Date.now(),
            gridSize: size,
        })
    },

    handleNumberClick(e) {
        const { number } = e.currentTarget.dataset;
        const current = parseInt(number);
        const correctNumber = this.data.currentNumber;

        if (current === correctNumber) {
            const newNumber = correctNumber + 1;
            this.setData({ currentNumber: newNumber });
            
            if (newNumber > this.data.gridSize ** 2) {
                this.endTraining(true);
            }
        } else {
            this.setData({ errorCount: this.data.errorCount + 1 });
        }
    },

    endTraining(success) {
        const timeElapsed = Date.now() - this.data.startTime;
        const preciseTime = (timeElapsed / 1000).toFixed(4); // 精确到4位小数
        
        const record = {
            size: this.data.selectedSize,
            time: preciseTime, // 直接存储精确值
            errors: this.data.errorCount,
            date: new Date().toISOString()
        }

        // 存储训练记录
        const user = app.globalData.userInfo
        if (user) {
            const records = wx.getStorageSync('schulteRecords') || {}
            records[user.openid] = records[user.openid] || []
            records[user.openid].push(record)
            wx.setStorageSync('schulteRecords', records)
        }

        wx.showModal({
            title: '训练完成',
            content: `总耗时：${preciseTime}秒\n错误次数：${this.data.errorCount}`,
            showCancel: false,
            complete: () => {
                this.setData({ isTraining: false })
            }
        })
    },

    generateNumbers() {
        const size = this.data.selectedSize
        const numbers = Array.from({length: size*size}, (_, i) => ({
            num: i + 1,
            status: '' // 包含状态字段
        }))
        const shuffled = numbers.sort(() => Math.random() - 0.5)
        
        this.setData({
            numberMatrix: shuffled,
            currentNumber: 1,
            errorCount: 0,
            startTime: Date.now(),
            gridSize: size,
        })
    },

    handleCellTap(e) {
        const value = parseInt(e.currentTarget.dataset.value);
        const expected = this.data.currentNumber;
        
        if (value === expected) {
            const newNumber = expected + 1;
            this.setData({ currentNumber: newNumber });
            
            if (newNumber > this.data.gridSize ** 2) {
                this.endTraining(true);
            }
        } else {
            this.setData({ errorCount: this.data.errorCount + 1 });
        }
    },

    saveRecord(endTime) {
        const duration = (endTime - this.data.startTime) / 1000; // 转换为秒
        const record = {
            date: new Date().toISOString(),
            gridSize: this.data.gridSize,
            duration: duration.toFixed(2),
            mistakes: this.data.errorCount
        };
        
        // 更新当前会话中显示的记录（游客模式也可以查看本次会话的记录）
        this.setData({
            records: [record, ...this.data.records]
        });
        
        // 只有非游客模式才永久存储数据
        if (!this.data.isGuest && getApp().globalData.userInfo) {
            // 获取之前的记录
            const records = wx.getStorageSync('schulteRecords') || {};
            const userId = getApp().globalData.userInfo.openid || getApp().globalData.userInfo.nickName;
            records[userId] = records[userId] || [];
            records[userId].push(record);
            
            // 保存记录
            wx.setStorageSync('schulteRecords', records);
        }
    },
})