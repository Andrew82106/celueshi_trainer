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
        gridSize: 5 // 新增gridSize用于动态样式
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

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
        const { number, index } = e.currentTarget.dataset;
        const current = parseInt(number);
        const correctNumber = this.data.currentNumber;
        const matrix = [...this.data.numberMatrix];

        if (current === correctNumber) {
            matrix[index].status = 'correct';
            this.setData({ numberMatrix: matrix });
            
            setTimeout(() => {
                matrix[index].status = '';
                this.setData({ 
                    numberMatrix: matrix,
                    currentNumber: correctNumber + 1
                });
                
                if (correctNumber === this.data.gridSize ** 2) {
                    this.endTraining(true);
                }
            }, 300);
        } else {
            matrix[index].status = 'wrong';
            this.setData({
                numberMatrix: matrix,
                errorCount: this.data.errorCount + 1
            });
            
            setTimeout(() => {
                matrix[index].status = '';
                this.setData({ numberMatrix: matrix });
            }, 300);
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
        const value = e.currentTarget.dataset.value;
        const expected = this.data.currentNumber;
        
        if (value === expected) {
            if (value === this.data.size * this.data.size) {
                this.endTraining(true);
            } else {
                this.setData({ currentNumber: expected + 1 });
                // 添加点击正确反馈
                this.animateCell(e.currentTarget.id, true);
            }
        } else {
            // 原有错误处理...
        }
    },

    animateCell(id, isCorrect) {
        // 实现单元格高亮动画的逻辑
    }
})