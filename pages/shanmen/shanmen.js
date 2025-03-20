// pages/shanmen/shanmen.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        animationCompleted: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 为每个字符在其显示后添加visible类，显示下划线
        this.addVisibleClass();
        
        // 等待所有字符显示完成，最后一个字符动画完成后
        setTimeout(() => {
            // 为所有字符添加淡出动画
            this.addFadeOutAnimation();
            
            this.setData({
                animationCompleted: true
            });
            
            // 所有字符淡出后，跳转到木鱼页面
            setTimeout(() => {
                wx.switchTab({
                    url: '/pages/muyu/muyu'
                });
            }, 2000); // 等待所有字符淡出完成(2s + 1s)
            
        }, 2000); // 等待最后一个字符完成显示动画(1.8s + 0.8s)
    },
    
    /**
     * 为所有字符添加淡出动画
     */
    addFadeOutAnimation() {
        const query = wx.createSelectorQuery();
        query.selectAll('.character').fields({
            node: true,
            properties: ['style'],
            computedStyle: ['animation']
        }, function(res) {
            if (res && res.length > 0) {
                res.forEach(char => {
                    if (char && char.node) {
                        char.node.style.animation = 'fadeInRight 0.8s forwards, fadeOutRight 1s 2s forwards';
                    }
                });
            }
        }).exec();
    },
    
    /**
     * 为每个字符在其显示后添加visible类
     */
    addVisibleClass() {
        const delays = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8];
        
        delays.forEach((delay, index) => {
            setTimeout(() => {
                const query = wx.createSelectorQuery();
                query.select(`.character:nth-child(${index + 1})`).fields({
                    node: true,
                    properties: ['style'],
                    computedStyle: ['animation']
                }, function(res) {
                    if (res && res.node) {
                        res.node.classList.add('visible');
                    }
                }).exec();
            }, (delay + 0.8) * 1000); // 延迟时间 + 动画时间
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

    }
})