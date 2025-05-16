const app = getApp();

Page({
  data: {
    userInfo: {},
    trainingRecords: [],
    userId: ''
  },

  onLoad: function (options) {
    // 获取通过页面跳转传递的用户ID
    if (options.userId) {
      this.setData({
        userId: options.userId
      });
      this.loadUserInfo(options.userId);
      this.loadTrainingRecords(options.userId);
    } else {
      wx.showToast({
        title: '用户ID缺失',
        icon: 'none',
        complete: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    }
  },

  // 加载用户基本信息
  loadUserInfo: function(userId) {
    const db = app.globalData.db;
    
    wx.showLoading({
      title: '加载中',
    });
    
    db.collection('userinfo').doc(userId).get()
      .then(res => {
        wx.hideLoading();
        if (res.data) {
          console.log("获取用户信息成功:", res.data);
          this.setData({
            userInfo: res.data
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error("获取用户信息失败:", err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      });
  },

  // 加载用户训练记录
  loadTrainingRecords: function(userId) {
    const db = app.globalData.db;
    
    db.collection('trainlog')
      .where({
        openId: userId
      })
      .orderBy('date', 'desc')
      .limit(20)  // 获取最近20条记录
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          console.log(`获取到${res.data.length}条训练记录`);
          this.setData({
            trainingRecords: res.data
          });
        } else {
          console.log("未找到训练记录");
          this.setData({
            trainingRecords: []
          });
        }
      })
      .catch(err => {
        console.error("获取训练记录失败:", err);
        wx.showToast({
          title: '获取训练记录失败',
          icon: 'none'
        });
      });
  },

  // 返回上一页
  navigateBack: function() {
    wx.navigateBack();
  },

  onShareAppMessage: function () {
    return {
      title: '禅修训练',
      path: '/pages/index/index'
    }
  }
}) 