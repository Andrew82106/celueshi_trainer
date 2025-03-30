Page({
  data: {
    communityRecords: [],
    currentPage: 0,
    pageSize: 10,
    hasMoreRecords: true,
    showDetailModal: false,
    currentRecord: null,
    currentRecordIndex: -1,
    tabs: ['热门', '最新'],
    currentTab: 0,
    userLikes: {} // 存储用户已点赞的记录ID
  },
  
  onLoad: function(options) {
    // 加载本地存储的点赞记录
    this.loadLocalUserLikes();
    this.loadCommunityRecords();
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },
  
  // 切换标签
  switchTab: function(e) {
    const tabIndex = e.currentTarget.dataset.index;
    if (tabIndex !== this.data.currentTab) {
      this.setData({
        currentTab: tabIndex,
        communityRecords: [],
        currentPage: 0,
        hasMoreRecords: true
      });
      this.loadCommunityRecords();
    }
  },
  
  // 从本地存储加载用户点赞记录
  loadLocalUserLikes: function() {
    try {
      const userLikes = wx.getStorageSync('communityLikes') || {};
      this.setData({
        userLikes: userLikes
      });
      console.log('加载本地点赞记录', userLikes);
    } catch (e) {
      console.error('读取本地点赞记录失败', e);
    }
  },
  
  // 保存用户点赞记录到本地存储
  saveLocalUserLikes: function() {
    try {
      wx.setStorageSync('communityLikes', this.data.userLikes);
    } catch (e) {
      console.error('保存本地点赞记录失败', e);
    }
  },
  
  // 加载社区感想
  loadCommunityRecords: function() {
    if (!this.data.hasMoreRecords) return;
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 显示加载提示
    wx.showLoading({
      title: '加载中',
    });
    
    // 构建查询
    let query = db.collection('writelog');
    
    // 查询条件: visible为true或者visible字段不存在的记录
    query = query.where(_.or([
      { visible: true },
      { visible: _.exists(false) }
    ]));
    
    // 根据当前标签排序
    if (this.data.currentTab === 0) {
      // 热门感想（按点赞数排序）
      query = query.orderBy('like', 'desc');
    } else {
      // 最新感想
      query = query.orderBy('timestamp', 'desc');
    }
    
    // 查询数据
    query.skip(this.data.currentPage * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        if (res.data.length === 0) {
          wx.hideLoading();
          this.setData({
            hasMoreRecords: false
          });
          return;
        }

        // 获取所有openId列表
        const openIds = res.data.map(record => record.openId);
        
        // 查询用户信息
        db.collection('userinfo')
          .where({
            openId: db.command.in(openIds)
          })
          .get()
          .then(userRes => {
            // 创建用户信息映射
            const userMap = {};
            userRes.data.forEach(user => {
              userMap[user.openId] = {
                nickName: user.nickName || '禅修者',
                // 计算用户段位
                userLevel: this.calculateUserLevel(Math.ceil((user.accumulateMuyuTime + user.accumulateSongboTime) / 60))
              };
            });
            
            const newRecords = res.data.map(record => {
              // 生成预览文本（最多显示50个字符）
              let preview = record.content || '';
              if (preview.length > 50) {
                preview = preview.substring(0, 50) + '...';
              }
              
              // 获取用户信息
              const userInfo = userMap[record.openId] || { nickName: '禅修者', userLevel: '初入山门' };
              
              // 判断当前用户是否已点赞该记录
              const liked = this.data.userLikes[record._id] === true;
              
              return {
                ...record,
                preview: preview,
                nickName: userInfo.nickName,
                userLevel: userInfo.userLevel,
                likes: record.like || 0,
                liked: liked
              };
            });
            
            // 判断是否还有更多记录
            const hasMore = newRecords.length === this.data.pageSize;
            
            wx.hideLoading();
            this.setData({
              communityRecords: [...this.data.communityRecords, ...newRecords],
              currentPage: this.data.currentPage + 1,
              hasMoreRecords: hasMore
            });
          })
          .catch(err => {
            wx.hideLoading();
            console.error('获取用户信息失败', err);
            wx.showToast({
              title: '加载失败',
              icon: 'none'
            });
          });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('获取社区感想失败', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },
  
  // 计算用户段位
  calculateUserLevel(totalMinutes) {
    if (totalMinutes >= 1500) {
      return "山门9段";
    } else if (totalMinutes >= 1200) {
      return "山门8段";
    } else if (totalMinutes >= 900) {
      return "山门7段";
    } else if (totalMinutes >= 600) {
      return "山门6段";
    } else if (totalMinutes >= 300) {
      return "山门5段";
    } else if (totalMinutes >= 200) {
      return "山门4段";
    } else if (totalMinutes >= 120) {
      return "山门3段";
    } else if (totalMinutes >= 60) {
      return "山门2段";
    } else if (totalMinutes >= 10) {
      return "山门1段";
    } else {
      return "初入山门";
    }
  },
  
  // 加载更多记录
  loadMoreRecords: function() {
    this.loadCommunityRecords();
  },
  
  // 查看感想详情
  viewRecordDetail: function(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.communityRecords[index];
    
    this.setData({
      currentRecord: record,
      currentRecordIndex: index,
      showDetailModal: true
    });
  },
  
  // 关闭详情弹窗
  closeDetailModal: function() {
    this.setData({
      showDetailModal: false,
      currentRecord: null,
      currentRecordIndex: -1
    });
  },
  
  // 点赞功能
  likeRecord: function(e) {
    const app = getApp();
    if (!app.globalData.userInfo || !app.globalData.userInfo.openId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    const record = index === this.data.currentRecordIndex ? 
                  this.data.currentRecord : 
                  this.data.communityRecords[index];
    
    // 如果用户已经点赞过，提示不能重复点赞
    if (this.data.userLikes[record._id]) {
      wx.showToast({
        title: '已点赞',
        icon: 'none'
      });
      return;
    }
    
    const db = wx.cloud.database();
    
    // 更新数据库中的点赞数
    db.collection('writelog').doc(record._id).update({
      data: {
        like: (record.like || 0) + 1
      }
    }).then(() => {
      // 更新本地数据
      const updatedRecords = [...this.data.communityRecords];
      
      // 如果是从列表点赞
      if (index !== this.data.currentRecordIndex) {
        updatedRecords[index].likes = (updatedRecords[index].likes || 0) + 1;
        updatedRecords[index].liked = true;
      } else {
        // 从详情页点赞，需要找到原列表中的对应项
        for (let i = 0; i < updatedRecords.length; i++) {
          if (updatedRecords[i]._id === record._id) {
            updatedRecords[i].likes = (updatedRecords[i].likes || 0) + 1;
            updatedRecords[i].liked = true;
            break;
          }
        }
      }
      
      // 更新用户的点赞记录
      const userLikes = { ...this.data.userLikes };
      userLikes[record._id] = true;
      
      // 更新当前记录（如果在详情页中）
      let currentRecord = this.data.currentRecord;
      if (currentRecord && currentRecord._id === record._id) {
        currentRecord = {
          ...currentRecord,
          likes: (currentRecord.likes || 0) + 1,
          liked: true
        };
      }
      
      this.setData({
        communityRecords: updatedRecords,
        userLikes: userLikes,
        currentRecord: currentRecord
      });
      
      // 保存点赞记录到本地存储
      this.saveLocalUserLikes();
      
      wx.showToast({
        title: '点赞成功',
        icon: 'success'
      });
    }).catch(err => {
      console.error('点赞失败', err);
      wx.showToast({
        title: '点赞失败',
        icon: 'none'
      });
    });
  }
}) 