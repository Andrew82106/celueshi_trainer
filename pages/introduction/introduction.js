// pages/introduction/introduction.js
const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        userInfo: null,
        isSchulteExpanded: true,
        isDotExpanded: true,
        schulteRecords: [],
        dotRecords: [],
        activeTab: 'schulte',
        audioRecords: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 页面加载时的逻辑
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
        const user = app.globalData.userInfo
        if (user) {
            const records = wx.getStorageSync('schulteRecords')?.[user.openid] || []
            this.setData({
                userInfo: user,
                schulteRecords: records.map(r => ({
                    ...r,
                    date: new Date(r.date).toLocaleString(),
                    time: typeof r.time === 'number' ? r.time : parseFloat(r.time)
                })).sort((a, b) => a.time - b.time),
                audioRecords: wx.getStorageSync('audioRecords')?.[user.openid] || []
            })
        }
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

    handleLogin() {
        wx.getUserProfile({
            desc: '用于展示用户信息',
            success: (res) => {
                app.globalData.userInfo = res.userInfo
                wx.setStorageSync('userInfo', res.userInfo)
                this.setData({
                    userInfo: res.userInfo
                })
                wx.reLaunch({ url: '/pages/profile/profile' })
            },
            fail: (err) => {
                wx.showToast({
                    title: '登录已取消',
                    icon: 'none'
                })
            }
        })
    },

    deleteRecord(e) {
        const { type, index } = e.currentTarget.dataset
        const recordType = type === 'schulte' ? 'schulteRecords' : 'dotRecords'
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条训练记录吗？',
            success: (res) => {
                if (res.confirm) {
                    const records = [...this.data[recordType]]
                    records.splice(index, 1)
                    
                    // 更新存储
                    const user = getApp().globalData.userInfo
                    if (user) {
                        const storageKey = `${type}Records`
                        const allRecords = wx.getStorageSync(storageKey) || {}
                        allRecords[user.openid] = records
                        wx.setStorageSync(storageKey, allRecords)
                    }
                    
                    // 更新视图
                    this.setData({ [recordType]: records })
                    wx.showToast({ title: '删除成功' })
                }
            }
        });
    },

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${minutes}分${seconds.toString().padStart(2, '0')}秒`
    },

    toggleRecords() {
        this.setData({ 
            isSchulteExpanded: !this.data.isSchulteExpanded,
            isDotExpanded: !this.data.isDotExpanded
        })
    },

    loadRecords() {
        const user = app.globalData.userInfo;
        if (user) {
            // 舒尔特表记录
            const schulte = wx.getStorageSync('schulteRecords')?.[user.openid] || [];
            // 圆点闪视记录（参考dot-training.js startLine:224-228）
            const dot = wx.getStorageSync('dotRecords')?.[user.openid] || [];
            
            this.setData({
                schulteRecords: this.formatRecords(schulte, 'schulte'),
                dotRecords: this.formatRecords(dot, 'dot')
            });
        }
    },

    formatRecords(records, type) {
        return records.map(r => {
            const date = new Date(r.date)
            return {
                ...r,
                formattedDate: isNaN(date) ? '未知日期' : date.toLocaleDateString(),
                accuracy: type === 'dot' ? 
                    `${Math.round((r.correct / r.userAnswer)*100)}%` : 
                    null
            }
        }).reverse();
    },

    switchTab(e) {
        this.setData({ activeTab: e.currentTarget.dataset.type });
    },

    toggleSchulteRecords() {
        this.setData({ isSchulteExpanded: !this.data.isSchulteExpanded });
    },

    toggleDotRecords() {
        this.setData({ 
            isDotExpanded: !this.data.isDotExpanded 
        })
    },

    // 处理返回按钮点击
    onBack() {
        wx.navigateBack();
    }
})