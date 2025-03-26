const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const trainlogCollection = db.collection('trainlog');
const usersCollection = db.collection('userinfo');

Page({
  data: {
    // 日期筛选
    startDate: '',
    endDate: '',
    currentDate: '', // 当前日期，用于日期选择器的最大值
    
    // 搜索
    searchKeyword: '',
    
    // 数据
    records: [],
    totalRecords: 0,
    
    // 分页
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    
    // 用户信息缓存，避免重复查询
    userInfoCache: {}
  },

  onLoad: function (options) {
    // 检查管理员权限
    if (!app.globalData.userInfo || !app.globalData.userInfo.admin) {
      wx.showToast({
        title: '无权限访问',
        icon: 'none'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 设置当前日期为今天
    const today = new Date();
    const formattedToday = this.formatDate(today);
    
    // 设置默认的开始日期为30天前
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const formattedThirtyDaysAgo = this.formatDate(thirtyDaysAgo);
    
    this.setData({
      currentDate: formattedToday,
      endDate: formattedToday,
      startDate: formattedThirtyDaysAgo
    });
    
    this.loadRecords();
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  // 解析日期字符串为 Date 对象
  parseDate: function(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  },
  
  // 开始日期变更
  onStartDateChange: function(e) {
    this.setData({
      startDate: e.detail.value,
      currentPage: 1 // 重置页码
    });
    this.loadRecords();
  },
  
  // 结束日期变更
  onEndDateChange: function(e) {
    this.setData({
      endDate: e.detail.value,
      currentPage: 1 // 重置页码
    });
    this.loadRecords();
  },
  
  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },
  
  // 执行搜索
  onSearch: function() {
    this.setData({
      currentPage: 1 // 重置页码
    });
    this.loadRecords();
  },
  
  // 前一页
  prevPage: function() {
    if (this.data.currentPage > 1) {
      this.setData({
        currentPage: this.data.currentPage - 1
      });
      this.loadRecords();
    }
  },
  
  // 后一页
  nextPage: function() {
    if (this.data.currentPage < this.data.totalPages) {
      this.setData({
        currentPage: this.data.currentPage + 1
      });
      this.loadRecords();
    }
  },
  
  // 加载训练记录
  loadRecords: async function() {
    wx.showLoading({
      title: '加载中',
    });
    
    try {
      // 构建查询条件
      let query = trainlogCollection.orderBy('date', 'desc');
      
      // 日期筛选
      if (this.data.startDate && this.data.endDate) {
        const startDate = this.data.startDate;
        const endDate = this.data.endDate;
        
        query = query.where({
          date: _.gte(startDate).and(_.lte(endDate))
        });
      }
      
      // 先获取总记录数
      const countResult = await query.count();
      const total = countResult.total;
      
      // 计算总页数
      const totalPages = Math.ceil(total / this.data.pageSize);
      
      // 获取当前页的数据
      const skip = (this.data.currentPage - 1) * this.data.pageSize;
      const recordsResult = await query.skip(skip).limit(this.data.pageSize).get();
      
      const records = recordsResult.data;
      
      // 处理记录，添加用户信息和格式化日期
      const processedRecords = await this.processRecords(records);
      
      this.setData({
        records: processedRecords,
        totalRecords: total,
        totalPages: totalPages || 1
      });
      
      // 如果搜索关键字不为空，进行前端筛选
      if (this.data.searchKeyword) {
        this.filterRecordsByKeyword();
      }
    } catch (error) {
      console.error('加载训练记录失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },
  
  // 处理记录，添加用户信息和格式化日期
  processRecords: async function(records) {
    const processedRecords = [];
    
    for (const record of records) {
      // 日期已经是格式化好的，直接使用
      const formattedDate = record.date;
      
      // 获取用户信息
      let userInfo = this.data.userInfoCache[record.openId];
      
      if (!userInfo) {
        try {
          const userResult = await usersCollection.where({
            openId: record.openId
          }).get();
          
          if (userResult.data.length > 0) {
            userInfo = userResult.data[0];
            
            // 更新缓存
            const cache = { ...this.data.userInfoCache };
            cache[record.openId] = userInfo;
            this.setData({
              userInfoCache: cache
            });
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
        }
      }
      
      processedRecords.push({
        ...record,
        date: formattedDate,
        nickName: userInfo ? userInfo.nickName : '未知用户',
        avatarUrl: userInfo ? userInfo.avatarUrl : ''
      });
    }
    
    return processedRecords;
  },
  
  // 按关键字筛选记录（前端筛选）
  filterRecordsByKeyword: function() {
    if (!this.data.searchKeyword) return;
    
    const keyword = this.data.searchKeyword.toLowerCase();
    const filteredRecords = this.data.records.filter(record => {
      const nickName = (record.nickName || '').toLowerCase();
      return nickName.includes(keyword);
    });
    
    this.setData({
      records: filteredRecords,
      totalRecords: filteredRecords.length,
      totalPages: Math.ceil(filteredRecords.length / this.data.pageSize) || 1
    });
  },

  // 返回上一页
  navigateBack: function() {
    wx.navigateBack();
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '禅学习-训练记录',
      path: '/pages/main/main'
    };
  }
}); 