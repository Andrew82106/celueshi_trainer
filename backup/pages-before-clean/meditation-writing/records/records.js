Page({
  data: {
    records: [],
    currentFilter: 'all', // 'all', 'week', 'month'
    currentPage: 0,
    pageSize: 10,
    hasMoreRecords: true,
    showDetailModal: false,
    currentRecord: null,
    isLoading: false,  // 添加加载状态
    isFirstLoad: true,  // 添加首次加载标记
    currentRecordIndex: -1 // 添加当前记录索引
  },
  
  onLoad: function(options) {
    // 首次加载时，只在onLoad中处理数据
    // onShow也会被调用，但通过isFirstLoad标记避免重复加载
    this.setData({
      isFirstLoad: true,
      isLoading: false
    });
  },
  
  onShow: function() {
    // 每次页面显示时重新加载数据，以便显示最新内容
    if (this.data.isLoading) {
      return; // 如果正在加载中，则不重复加载
    }
    
    this.setData({
      records: [],
      currentPage: 0,
      hasMoreRecords: true,
      isLoading: true
    });
    
    wx.showLoading({
      title: '加载中',
      mask: true
    });
    
    // 使用Promise方式调用
    this.loadRecordsDirectly()
      .then(() => {
        this.setData({
          isLoading: false,
          isFirstLoad: false
        });
        wx.hideLoading();
      })
      .catch(error => {
        console.error('页面显示时数据加载失败', error);
        this.setData({
          isLoading: false,
          isFirstLoad: false
        });
        wx.hideLoading();
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      });
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },
  
  // 设置筛选条件
  setFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    if (filter !== this.data.currentFilter) {
      if (this.data.isLoading) {
        return; // 如果正在加载中，则不响应筛选操作
      }
      
      this.setData({
        currentFilter: filter,
        records: [],
        currentPage: 0,
        hasMoreRecords: true,
        isLoading: true
      });
      
      wx.showLoading({
        title: '筛选中',
        mask: true
      });
      
      this.loadRecordsDirectly()
        .then(() => {
          this.setData({
            isLoading: false
          });
          wx.hideLoading();
        })
        .catch(error => {
          console.error('筛选数据加载失败', error);
          this.setData({
            isLoading: false
          });
          wx.hideLoading();
          wx.showToast({
            title: '筛选失败',
            icon: 'none'
          });
        });
    }
  },
  
  // 直接加载记录（不检查isLoading状态）
  loadRecordsDirectly: function() {
    // 获取app实例
    const app = getApp();
    
    // 检查用户登录状态
    if (!app.globalData.userInfo || !app.globalData.userInfo.openId) {
      console.log('用户未登录，尝试获取用户信息');
      
      // 返回Promise以处理异步操作
      return new Promise((resolve, reject) => {
        // 设置回调函数，当用户信息准备好时会被调用
        app.userInfoReadyCallback = res => {
          console.log('用户信息已准备好', res);
          // 用户信息准备好后继续加载数据
          this.loadRecordsFromDB()
            .then(resolve)
            .catch(reject);
        };
        
        // 直接检查一次，可能在设置回调的同时用户信息已经准备好了
        setTimeout(() => {
          if (app.globalData.userInfo && app.globalData.userInfo.openId) {
            console.log('用户已登录，直接加载');
            this.loadRecordsFromDB()
              .then(resolve)
              .catch(reject);
          } else {
            // 3秒后如果还没有用户信息，则判定为登录失败
            setTimeout(() => {
              if (!app.globalData.userInfo || !app.globalData.userInfo.openId) {
                console.error('等待用户登录超时');
                reject('用户未登录或登录超时');
              }
            }, 3000);
          }
        }, 100);
      });
    }
    
    // 已登录，直接加载数据
    return this.loadRecordsFromDB();
  },
  
  // 加载记录（带isLoading状态检查，用于loadMore）
  loadRecords: function() {
    if (!this.data.hasMoreRecords || this.data.isLoading) {
      console.log('已无更多数据或正在加载中，跳过加载');
      return Promise.resolve([]);
    }
    
    this.setData({
      isLoading: true
    });
    
    return this.loadRecordsDirectly()
      .then(result => {
        this.setData({
          isLoading: false
        });
        return result;
      })
      .catch(error => {
        this.setData({
          isLoading: false
        });
        throw error;
      });
  },
  
  // 从数据库加载记录
  loadRecordsFromDB: function() {
    const app = getApp();
    const openId = app.globalData.userInfo.openId;
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 构建筛选条件
    let queryCondition = {
      openId: openId
    };
    
    // 根据筛选条件添加日期范围
    if (this.data.currentFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      if (this.data.currentFilter === 'week') {
        // 计算本周开始日期（周一）
        const day = now.getDay() || 7; // 将周日(0)转为7
        const diff = now.getDate() - day + 1; // +1 是为了从周一开始
        startDate = new Date(now.setDate(diff));
      } else if (this.data.currentFilter === 'month') {
        // 计算本月开始日期
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      const startDateStr = startDate.getFullYear() + '-' + 
        ('0' + (startDate.getMonth() + 1)).slice(-2) + '-' + 
        ('0' + startDate.getDate()).slice(-2);
        
      queryCondition.date = _.gte(startDateStr);
    }
    
    console.log('查询条件：', queryCondition);
    
    // 将查询数据封装为Promise
    return new Promise((resolve, reject) => {
      // 查询数据
      db.collection('writelog')
        .where(queryCondition)
        .orderBy('date', 'desc')
        .skip(this.data.currentPage * this.data.pageSize)
        .limit(this.data.pageSize)
        .get()
        .then(res => {
          console.log('获取到记录数:', res.data.length);
          
          const newRecords = res.data.map(record => {
            // 生成预览文本（最多显示50个字符）
            let preview = record.content || '';
            if (preview.length > 50) {
              preview = preview.substring(0, 50) + '...';
            }
            
            return {
              ...record,
              preview: preview
            };
          });
          
          // 判断是否还有更多记录
          const hasMore = newRecords.length === this.data.pageSize;
          
          this.setData({
            records: [...this.data.records, ...newRecords],
            currentPage: this.data.currentPage + 1,
            hasMoreRecords: hasMore
          });
          
          resolve(newRecords);
        })
        .catch(err => {
          console.error('获取记录失败', err);
          reject(err);
        });
    });
  },
  
  // 加载更多记录
  loadMoreRecords: function() {
    if (this.data.isLoading || !this.data.hasMoreRecords) {
      return;
    }
    
    wx.showLoading({
      title: '加载更多',
      mask: true
    });
    
    this.loadRecords()
      .then(() => {
        wx.hideLoading();
      })
      .catch(error => {
        console.error('加载更多记录失败', error);
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },
  
  // 查看记录详情
  viewRecordDetail: function(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.records[index];
    
    this.setData({
      currentRecord: record,
      showDetailModal: true,
      currentRecordIndex: index // 保存当前记录的索引
    });
  },
  
  // 关闭详情弹窗
  closeDetailModal: function() {
    this.setData({
      showDetailModal: false,
      currentRecord: null,
      currentRecordIndex: -1 // 重置索引
    });
  },
  
  // 切换记录可见性
  toggleRecordVisibility: function(e) {
    const recordId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const record = this.data.records[index];
    const currentVisibility = record.visible !== false; // 如果未定义则视为true
    
    wx.showLoading({
      title: currentVisibility ? '正在设为私密' : '正在设为公开',
      mask: true
    });
    
    const db = wx.cloud.database();
    
    // 更新数据库中的可见性
    db.collection('writelog').doc(recordId).update({
      data: {
        visible: !currentVisibility
      }
    }).then(() => {
      // 更新本地数据
      const updatedRecords = [...this.data.records];
      updatedRecords[index].visible = !currentVisibility;
      
      // 如果当前正在显示该记录的详情，也需要更新详情数据
      let currentRecord = this.data.currentRecord;
      if (currentRecord && currentRecord._id === recordId) {
        currentRecord = {
          ...currentRecord,
          visible: !currentVisibility
        };
      }
      
      this.setData({
        records: updatedRecords,
        currentRecord: currentRecord
      });
      
      wx.hideLoading();
      wx.showToast({
        title: currentVisibility ? '已设为私密' : '已设为公开',
        icon: 'success'
      });
    }).catch(err => {
      console.error('修改可见性失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },
  
  // 删除记录
  deleteRecord: function(e) {
    const recordId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    // 显示确认对话框
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteRecord(recordId, index);
        }
      }
    });
  },
  
  // 执行删除记录操作
  performDeleteRecord: function(recordId, index) {
    wx.showLoading({
      title: '正在删除',
      mask: true
    });
    
    const app = getApp();
    const openId = app.globalData.userInfo.openId;
    const db = wx.cloud.database();
    const record = this.data.records[index];
    const deleteCount = record.count || 0; // 获取要删除的记录字数
    
    // 从数据库中删除记录
    db.collection('writelog').doc(recordId).remove()
      .then(() => {
        // 更新用户信息表中的累积字数
        return db.collection('userinfo').where({
          openId: openId
        }).get();
      })
      .then(res => {
        if (res.data && res.data.length > 0) {
          const userInfo = res.data[0];
          const currentCount = userInfo.accumulateCount || 0;
          // 计算新的累积字数，确保不会出现负数
          const newCount = Math.max(0, currentCount - deleteCount);
          
          // 更新用户信息
          return db.collection('userinfo').doc(userInfo._id).update({
            data: {
              accumulateCount: newCount
            }
          });
        }
        return Promise.resolve(); // 如果没有找到用户信息，返回一个已解决的Promise
      })
      .then(() => {
        // 更新本地数据
        const updatedRecords = [...this.data.records];
        updatedRecords.splice(index, 1);
        
        // 如果当前正在显示该记录的详情，则关闭详情弹窗
        if (this.data.currentRecord && this.data.currentRecord._id === recordId) {
          this.setData({
            showDetailModal: false,
            currentRecord: null,
            currentRecordIndex: -1
          });
        }
        
        this.setData({
          records: updatedRecords
        });
        
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        // 尝试获取并刷新主页面
        const pages = getCurrentPages();
        // 查找内观写作主页
        const meditationWritingPage = pages.find(page => page.route === 'pages/meditation-writing/meditation-writing');
        
        if (meditationWritingPage) {
          // 如果找到了主页面实例，调用它的加载数据方法
          meditationWritingPage.loadUserWritingData();
        } else {
          // 如果没有找到主页面实例，可以通过事件机制通知
          getApp().globalData.needRefreshWritingData = true;
        }
      })
      .catch(err => {
        console.error('删除记录失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      });
  },
  
  // 开始写作
  startWriting: function() {
    wx.navigateTo({
      url: '/packageZen/pages/meditation-writing/edit/edit',
    });
  }
}) 