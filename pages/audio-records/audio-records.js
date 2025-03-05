// pages/audio-records/audio-records.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        records: [],
        chartData: [],
        canvasWidth: 0,
        canvasHeight: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 获取设备信息以适应屏幕尺寸
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            canvasWidth: sysInfo.windowWidth - 40, // 左右各留20rpx边距
            canvasHeight: 200
        });
        
        this.loadRecords();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        this.drawChart();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        this.loadRecords();
        this.drawChart();
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

    // 加载记录数据
    loadRecords() {
        const user = getApp().globalData.userInfo;
        if (!user) return;
        
        const records = wx.getStorageSync('audioRecords')?.[user.openid] || [];
        console.log(records);
        // 处理记录，添加数字长度信息
        const processedRecords = records.map(r => {
            return {
                ...r,
                date: new Date(r.date).toLocaleString(),
                status: 'success',
                number: r.number,
                reversed: r.reversed,
                Length: r.number ? r.number.toString().length : 0
            };
        }).reverse();
        
        this.setData({
            records: processedRecords,
            chartData: this.prepareChartData(processedRecords)
        });
    },
    
    // 准备图表数据
    prepareChartData(records) {
        // 最多取最近10条记录用于绘制图表
        return records.slice(0, 10).reverse().map((record, index) => {
            return {
                index: index + 1,
                value: record.length,
                date: new Date(record.date).toLocaleDateString()
            };
        });
    },
    
    // 绘制折线图
    drawChart() {
        const chartData = this.data.chartData;
        if (chartData.length === 0) return;
        
        const ctx = wx.createCanvasContext('numberLengthChart');
        const width = this.data.canvasWidth;
        const height = this.data.canvasHeight;
        
        // 设置背景色
        ctx.setFillStyle('#FFFFFF');
        ctx.fillRect(0, 0, width, height);
        
        // 留边距
        const padding = { left: 40, right: 20, top: 20, bottom: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // 找出最大值和最小值
        let maxValue = Math.max(...chartData.map(item => item.value));
        let minValue = Math.min(...chartData.map(item => item.value));
        
        // 确保最小值为0，方便阅读
        minValue = 0;
        // 增加一点缓冲区，确保最高点不会顶到边界
        maxValue = Math.max(maxValue + 1, 5); // 至少显示到5
        
        // 绘制Y轴
        ctx.beginPath();
        ctx.setStrokeStyle('#CCCCCC');
        ctx.setLineWidth(1);
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.stroke();
        
        // 绘制X轴
        ctx.beginPath();
        ctx.moveTo(padding.left, height - padding.bottom);
        ctx.lineTo(width - padding.right, height - padding.bottom);
        ctx.stroke();
        
        // 绘制Y轴刻度 (整数刻度)
        const valueRange = maxValue - minValue;
        const stepCount = valueRange <= 5 ? valueRange : 5;
        const valueStep = valueRange / stepCount;
        
        for (let i = 0; i <= stepCount; i++) {
            const value = minValue + i * valueStep;
            const y = height - padding.bottom - (value - minValue) / valueRange * chartHeight;
            
            ctx.beginPath();
            ctx.setFontSize(10);
            ctx.setFillStyle('#666666');
            ctx.fillText(Math.round(value), 5, y + 3);
            
            // 绘制水平网格线
            ctx.beginPath();
            ctx.setStrokeStyle('#EEEEEE');
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }
        
        // 计算X轴间距
        const xStep = chartWidth / (chartData.length - 1 || 1);
        
        // 绘制折线
        if (chartData.length > 1) {
            ctx.beginPath();
            ctx.setStrokeStyle('#4A90E2');
            ctx.setLineWidth(2);
            
            chartData.forEach((item, index) => {
                const x = padding.left + index * xStep;
                const y = height - padding.bottom - ((item.value - minValue) / valueRange) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                // 绘制X轴标签（每隔一定数量绘制，避免拥挤）
                if (index % Math.max(1, Math.floor(chartData.length / 5)) === 0) {
                    ctx.setFontSize(10);
                    ctx.setFillStyle('#666666');
                    ctx.fillText(item.index, x - 3, height - padding.bottom + 15);
                }
            });
            
            ctx.stroke();
            
            // 绘制数据点和值标签
            chartData.forEach((item, index) => {
                const x = padding.left + index * xStep;
                const y = height - padding.bottom - ((item.value - minValue) / valueRange) * chartHeight;
                
                ctx.beginPath();
                ctx.setFillStyle('#4A90E2');
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // 在数据点上方显示具体数值
                ctx.setFontSize(10);
                ctx.setFillStyle('#333333');
                ctx.fillText(item.value, x - 3, y - 10);
            });
        } else if (chartData.length === 1) {
            // 仅有一个数据点的情况
            const x = padding.left + chartWidth / 2;
            const y = height - padding.bottom - ((chartData[0].value - minValue) / valueRange) * chartHeight;
            
            ctx.beginPath();
            ctx.setFillStyle('#4A90E2');
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 在数据点上方显示具体数值
            ctx.setFontSize(10);
            ctx.setFillStyle('#333333');
            ctx.fillText(chartData[0].value, x - 3, y - 10);
            
            ctx.setFontSize(10);
            ctx.setFillStyle('#666666');
            ctx.fillText(chartData[0].index, x - 3, height - padding.bottom + 15);
        }
        
        // 绘制标题
        ctx.setFontSize(14);
        ctx.setFillStyle('#333333');
        ctx.fillText('数字长度趋势', width / 2 - 40, padding.top - 5);
        
        ctx.draw();
    },

    deleteRecord(e) {
        const index = e.currentTarget.dataset.index;
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条记录吗？',
            success: (res) => {
                if (res.confirm) {
                    const user = getApp().globalData.userInfo;
                    const records = [...this.data.records];
                    records.splice(index, 1);
                    
                    if (user) {
                        const allRecords = wx.getStorageSync('audioRecords') || {};
                        allRecords[user.openid] = records;
                        wx.setStorageSync('audioRecords', allRecords);
                    }
                    
                    this.setData({ records });
                    this.drawChart(); // 重新绘制图表
                    wx.showToast({ title: '删除成功' });
                }
            }
        });
    },
    
    onBack() {
        wx.navigateBack()
    }
})