// pages/dot-records/dot-records.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        records: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.loadRecords();
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
    loadRecords() {
        const user = getApp().globalData.userInfo;
        if (user) {
          const records = wx.getStorageSync('dotRecords')?.[user.openid] || [];
          this.setData({
            records: records.map(r => ({
              ...r,
              formattedDate: new Date(r.date).toLocaleDateString(),
              duration: `${r.displayTime}秒`,
              accuracy: `${Math.round((r.correct / r.userAnswer)*100)}%`
            })).reverse()
          });
        }
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
                const allRecords = wx.getStorageSync('dotRecords') || {};
                allRecords[user.openid] = records;
                wx.setStorageSync('dotRecords', allRecords);
              }
              
              this.setData({ records });
              wx.showToast({ title: '删除成功' });
            }
          }
        });
      },
      onBack() {
        wx.navigateBack()
      }
})