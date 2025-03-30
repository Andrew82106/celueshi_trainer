Page({

  /**
   * 页面的初始数据
   */
  data: {
    lastWritingDate: '',
    lastWritingCount: 0,
    lastWritingInsightCount: 0,
    lastWritingContent: '',
    lastWritingContentPreview: '',
    totalWritingTimes: 0,
    totalWordCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadUserWritingData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadUserWritingData();
  },

  /**
   * 加载用户写作数据
   */
  loadUserWritingData() {
    const that = this;
    const app = getApp();
    
    // 从全局获取用户openId
    if (!app.globalData.userInfo || !app.globalData.userInfo.openId) {
      console.error('用户未登录');
      return;
    }
    
    const openId = app.globalData.userInfo.openId;
    
    // 从云数据库获取写作记录
    wx.cloud.database().collection('writelog')
      .where({
        openId: openId
      })
      .orderBy('date', 'desc')
      .limit(1)
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const lastRecord = res.data[0];
          
          // 生成预览文本（最多显示50个字符）
          let contentPreview = lastRecord.content || '';
          if (contentPreview.length > 50) {
            contentPreview = contentPreview.substring(0, 50) + '...';
          }
          
          that.setData({
            lastWritingDate: lastRecord.date,
            lastWritingCount: lastRecord.count || 0,
            lastWritingInsightCount: lastRecord.insightCount || 0,
            lastWritingContent: lastRecord.content || '',
            lastWritingContentPreview: contentPreview
          });
        } else {
          // 没有找到记录时，清空最近写作数据
          that.setData({
            lastWritingDate: '',
            lastWritingCount: 0,
            lastWritingInsightCount: 0,
            lastWritingContent: '',
            lastWritingContentPreview: ''
          });
        }
      })
      .catch(err => {
        console.error('获取最近一次写作记录失败', err);
        // 发生错误时也清空最近写作数据
        that.setData({
          lastWritingDate: '',
          lastWritingCount: 0,
          lastWritingInsightCount: 0,
          lastWritingContent: '',
          lastWritingContentPreview: ''
        });
      });
    
    // 获取累计统计数据
    wx.cloud.database().collection('userinfo')
      .where({
        openId: openId
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const userInfo = res.data[0];
          that.setData({
            totalWordCount: userInfo.accumulateCount || 0
          });
        }
      })
      .catch(err => {
        console.error('获取用户累计字数失败', err);
      });
    
    // 获取写作次数
    wx.cloud.database().collection('writelog')
      .where({
        openId: openId
      })
      .count()
      .then(res => {
        that.setData({
          totalWritingTimes: res.total || 0
        });
      })
      .catch(err => {
        console.error('获取写作次数失败', err);
      });
  },

  /**
   * 开始写作
   */
  startWriting() {
    wx.navigateTo({
      url: '/pages/meditation-writing/edit/edit',
    });
  },

  /**
   * 查看我的记录
   */
  viewMyRecords() {
    wx.navigateTo({
      url: '/pages/meditation-writing/records/records',
    });
  },

  /**
   * 查看社区感想
   */
  viewCommunity() {
    wx.navigateTo({
      url: '/pages/meditation-writing/community/community',
    });
  }
}) 