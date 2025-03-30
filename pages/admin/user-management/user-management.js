const app = getApp();
const { calculateUserLevel } = require('../../profileshanmen/utils/index');

Page({
  data: {
    users: [],
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalUsers: 0,
    searchKeyword: '',
    showUserDetail: false,
    selectedUser: null,
    isUpdatingAllUsers: false,
    updateProgress: 0,
    totalUsersToUpdate: 0
  },

  onLoad: function (options) {
    this.loadUsers();
  },

  onShow: function () {
    // 每次页面显示时检查权限
    this.checkAdminPermission();
  },

  // 检查管理员权限
  checkAdminPermission: function() {
    if (!app.globalData.userInfo || !app.globalData.userInfo.admin) {
      wx.showToast({
        title: '无权限访问',
        icon: 'none',
        complete: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    }
  },

  // 加载用户列表
  loadUsers: function() {
    const db = app.globalData.db;
    const _ = db.command;
    
    wx.showLoading({
      title: '加载中',
    });

    // 计算分页
    const skip = (this.data.currentPage - 1) * this.data.pageSize;
    
    // 构建查询条件
    let query = {};
    if (this.data.searchKeyword) {
      query.nickName = db.RegExp({
        regexp: this.data.searchKeyword,
        options: 'i'
      });
    }
    
    // 获取用户总数
    db.collection('userinfo').where(query).count().then(res => {
      const total = res.total;
      this.setData({
        totalUsers: total,
        totalPages: Math.ceil(total / this.data.pageSize)
      });
    }).catch(err => {
      console.error('获取用户总数失败:', err);
    });

    // 查询用户信息
    db.collection('userinfo')
      .where(query)
      .skip(skip)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        // 直接使用userinfo表中的数据
        this.setData({
          users: res.data
        });
        
        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取用户列表失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },
  
  // 计算连续训练天数（简化版）
  calculateStreakDays: function(trainRecords) {
    if (!trainRecords || trainRecords.length === 0) return 0;
    
    // 按日期排序（降序）
    const sortedRecords = trainRecords.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // 获取最近的一条记录日期
    const latestDate = new Date(sortedRecords[0].date);
    let streakDays = 1;
    
    // 遍历记录，检查连续性
    for (let i = 1; i < sortedRecords.length; i++) {
      const currentDate = new Date(sortedRecords[i].date);
      const diffDays = Math.floor((latestDate - currentDate) / (24 * 60 * 60 * 1000));
      
      // 如果与前一条记录相差正好一天，增加连续天数
      if (diffDays === i) {
        streakDays++;
      } else {
        break;
      }
    }
    
    return streakDays;
  },
  
  // 搜索框输入事件处理
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },
  
  // 执行搜索
  onSearch: function() {
    this.setData({
      currentPage: 1
    }, this.loadUsers);
  },
  
  // 上一页
  prevPage: function() {
    if (this.data.currentPage > 1) {
      this.setData({
        currentPage: this.data.currentPage - 1
      }, this.loadUsers);
    }
  },
  
  // 下一页
  nextPage: function() {
    if (this.data.currentPage < this.data.totalPages) {
      this.setData({
        currentPage: this.data.currentPage + 1
      }, this.loadUsers);
    }
  },
  
  // 显示用户详情
  showUserDetail: function(e) {
    const user = e.currentTarget.dataset.user;
    this.setData({
      showUserDetail: true,
      selectedUser: user
    });
  },
  
  // 隐藏用户详情
  hideUserDetail: function() {
    this.setData({
      showUserDetail: false,
      selectedUser: null
    });
  },
  
  // 切换管理员状态
  toggleAdminStatus: function() {
    const db = app.globalData.db;
    const user = this.data.selectedUser;
    
    wx.showLoading({
      title: '处理中',
    });
    
    db.collection('userinfo').doc(user._id).update({
      data: {
        admin: !user.admin
      }
    }).then(() => {
      wx.hideLoading();
      
      // 更新本地数据
      const users = this.data.users.map(u => {
        if (u._id === user._id) {
          return {...u, admin: !u.admin};
        }
        return u;
      });
      
      this.setData({
        users,
        selectedUser: {...this.data.selectedUser, admin: !user.admin}
      });
      
      wx.showToast({
        title: user.admin ? '已取消管理员权限' : '已设为管理员',
        icon: 'none'
      });
    }).catch(err => {
      console.error('更新用户权限失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },
  
  // 重置用户数据
  resetUserData: function() {
    const user = this.data.selectedUser;
    
    wx.showModal({
      title: '警告',
      content: `确定要重置 ${user.nickName || '该用户'} 的训练数据吗？此操作不可撤销。`,
      confirmText: '确定重置',
      confirmColor: '#FF0000',
      success: (res) => {
        if (res.confirm) {
          this.performDataReset(user._id);
        }
      }
    });
  },
  
  // 执行数据重置
  performDataReset: function(userId) {
    const db = app.globalData.db;
    
    wx.showLoading({
      title: '重置中',
    });
    
    // 删除该用户的所有训练记录
    db.collection('trainlog').where({
      openId: userId
    }).remove().then(res => {
      // 同时重置用户的累积数据
      db.collection('userinfo').doc(userId).update({
        data: {
          accumulateMuyu: 0,
          accumulateMuyuTime: 0,
          accumulateSongbo: 0,
          accumulateSongboTime: 0,
          lastUpdateTime: new Date().toISOString()
        }
      }).then(() => {
        wx.hideLoading();
        
        // 更新本地数据
        const users = this.data.users.map(u => {
          if (u._id === userId) {
            return {
              ...u, 
              accumulateMuyu: 0,
              accumulateMuyuTime: 0,
              accumulateSongbo: 0,
              accumulateSongboTime: 0
            };
          }
          return u;
        });
        
        // 更新本地状态
        this.setData({
          users,
          selectedUser: {
            ...this.data.selectedUser,
            accumulateMuyu: 0,
            accumulateMuyuTime: 0,
            accumulateSongbo: 0,
            accumulateSongboTime: 0
          }
        });
        
        wx.showToast({
          title: '数据已重置',
          icon: 'success'
        });
      }).catch(err => {
        console.error('重置用户累积数据失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
    }).catch(err => {
      console.error('重置用户数据失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },

  // 更新所有用户的累积数据
  updateAllUsersData: function() {
    const db = app.globalData.db;
    
    wx.showModal({
      title: '批量更新用户数据',
      content: '此操作将检查并更新所有用户的累积训练数据，可能需要一段时间。确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          this.performUpdateAllUsers();
        }
      }
    });
  },
  
  // 执行批量更新所有用户数据
  performUpdateAllUsers: function() {
    const db = app.globalData.db;
    const _ = db.command;
    
    wx.showLoading({
      title: '准备更新...',
    });
    
    this.setData({
      isUpdatingAllUsers: true,
      updateProgress: 0
    });
    
    // 先获取所有用户
    db.collection('userinfo').count().then(res => {
      const totalUsers = res.total;
      this.setData({
        totalUsersToUpdate: totalUsers
      });
      
      // 由于云函数一次最多获取20条记录，需要分批获取
      const batchTimes = Math.ceil(totalUsers / 20);
      let userProcessed = 0;
      
      // 创建批次处理任务
      const tasks = [];
      for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('userinfo')
          .skip(i * 20)
          .limit(20)
          .get();
        tasks.push(promise);
      }
      
      // 串行处理每个批次
      this.processBatchTasks(tasks, 0, []);
    }).catch(err => {
      console.error('获取用户总数失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
      this.setData({
        isUpdatingAllUsers: false
      });
    });
  },
  
  // 串行处理批次任务
  processBatchTasks: function(tasks, index, allUsers) {
    if (index >= tasks.length) {
      // 所有批次已获取，开始处理用户数据
      wx.hideLoading();
      this.processAllUsers(allUsers);
      return;
    }
    
    wx.showLoading({
      title: `获取用户 ${index+1}/${tasks.length}`,
    });
    
    tasks[index].then(res => {
      const users = res.data;
      allUsers = allUsers.concat(users);
      
      // 处理下一批次
      this.processBatchTasks(tasks, index + 1, allUsers);
    }).catch(err => {
      console.error('获取用户批次失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取用户失败',
        icon: 'none'
      });
      this.setData({
        isUpdatingAllUsers: false
      });
    });
  },
  
  // 处理所有用户的累积数据
  processAllUsers: function(users) {
    const db = app.globalData.db;
    const totalUsers = users.length;
    let processedCount = 0;
    
    // 创建进度显示
    const progressModal = wx.showToast({
      title: `处理中: 0/${totalUsers}`,
      icon: 'loading',
      duration: 1000000 // 设置超长时间
    });
    
    // 串行处理每个用户，避免并发请求过多
    this.processNextUser(users, 0, totalUsers, processedCount, {
      updated: 0,
      created: 0,
      noChange: 0,
      error: 0
    });
  },
  
  // 递归处理下一个用户
  processNextUser: function(users, index, totalUsers, processedCount, stats) {
    if (index >= totalUsers) {
      // 所有用户处理完毕
      wx.hideToast();
      this.setData({
        isUpdatingAllUsers: false,
        updateProgress: 100
      });
      
      wx.showModal({
        title: '更新完成',
        content: `共处理 ${totalUsers} 个用户:\n更新: ${stats.updated} 个\n新增: ${stats.created} 个\n无变化: ${stats.noChange} 个\n失败: ${stats.error} 个`,
        showCancel: false,
        success: (res) => {
          // 刷新当前用户列表
          this.loadUsers();
        }
      });
      return;
    }
    
    // 更新进度
    processedCount++;
    const progress = Math.floor((processedCount / totalUsers) * 100);
    this.setData({
      updateProgress: progress
    });
    
    // 显示进度
    wx.showToast({
      title: `处理中: ${processedCount}/${totalUsers}`,
      icon: 'loading',
      duration: 1000000
    });
    
    const user = users[index];
    this.updateUserAccumulateData(user).then(result => {
      // 更新统计
      stats[result.status]++;
      
      // 处理下一个用户
      setTimeout(() => {
        this.processNextUser(users, index + 1, totalUsers, processedCount, stats);
      }, 100);  // 适当延迟，避免请求过快
    }).catch(err => {
      console.error('更新用户数据失败:', err);
      stats.error++;
      
      // 处理下一个用户
      setTimeout(() => {
        this.processNextUser(users, index + 1, totalUsers, processedCount, stats);
      }, 100);
    });
  },
  
  // 更新单个用户的累积数据
  updateUserAccumulateData: function(user) {
    return new Promise((resolve, reject) => {
      const db = app.globalData.db;
      const userId = user._id;
      const userOpenId = user.openId || user._openid; // 优先使用openId，如果没有则尝试使用_openid
      
      // 检查是否有有效的openId
      if (!userOpenId) {
        console.error('用户缺少openId:', userId);
        resolve({
          status: 'error'
        });
        return;
      }
      
      // 检查用户是否已有累积数据字段
      const hasAccumulateData = 
        user.accumulateMuyu !== undefined && 
        user.accumulateMuyuTime !== undefined && 
        user.accumulateSongbo !== undefined && 
        user.accumulateSongboTime !== undefined;
      
      // 定义查询条件 - 只按用户ID查询，不使用日期限制
      const query = {
        openId: userOpenId
      };
      
      // 使用分页查询获取所有训练记录，不再根据lastUpdateTime过滤
      this.getAllTrainingRecords(db, query).then(records => {
        // 完全重新计算累积数据，而不是在原来基础上累加
        let totalMuyuCount = 0;
        let totalSongboCount = 0;
        let totalMuyuSeconds = 0;
        let totalSongboSeconds = 0;
        
        if (records && records.length > 0) {
          console.log(`用户${userOpenId}找到${records.length}条训练记录`);
          records.forEach(record => {
            totalMuyuCount += record.muyuCounts || 0;
            totalSongboCount += record.songboCounts || 0;
            totalMuyuSeconds += record.muyuSeconds || 0;
            totalSongboSeconds += record.songboSeconds || 0;
          });
          
          console.log(`用户${userOpenId}累积数据统计结果:`, {
            totalMuyuCount,
            totalSongboCount,
            totalMuyuSeconds,
            totalSongboSeconds
          });
        } else {
          console.log(`用户${userOpenId}没有找到任何训练记录`);
        }
        
        // 检查是否需要更新（有记录或者原本缺少累积数据字段）
        const needUpdate = !hasAccumulateData || records.length > 0;
        
        // 检查与当前值是否一致
        const isSameAsOld = 
          user.accumulateMuyu === totalMuyuCount &&
          user.accumulateMuyuTime === totalMuyuSeconds &&
          user.accumulateSongbo === totalSongboCount &&
          user.accumulateSongboTime === totalSongboSeconds;
        
        // 只有在需要更新且数据有变化的情况下才进行更新
        if (needUpdate && !isSameAsOld) {
          console.log(`用户${userOpenId}需要更新`, {
            old: {
              accumulateMuyu: user.accumulateMuyu || 0,
              accumulateMuyuTime: user.accumulateMuyuTime || 0,
              accumulateSongbo: user.accumulateSongbo || 0,
              accumulateSongboTime: user.accumulateSongboTime || 0
            },
            new: {
              accumulateMuyu: totalMuyuCount,
              accumulateMuyuTime: totalMuyuSeconds,
              accumulateSongbo: totalSongboCount,
              accumulateSongboTime: totalSongboSeconds
            }
          });
          
          // 计算用户段位
          const totalSeconds = totalMuyuSeconds + totalSongboSeconds;
          const totalMinutes = Math.ceil(totalSeconds / 60);
          
          // 计算用户段位
          const userLevel = calculateUserLevel(totalMinutes);
          
          // 更新用户数据
          const now = new Date();
          const formattedDate = now.toISOString();
          
          db.collection('userinfo').doc(userId).update({
            data: {
              accumulateMuyu: totalMuyuCount,
              accumulateMuyuTime: totalMuyuSeconds,
              accumulateSongbo: totalSongboCount,
              accumulateSongboTime: totalSongboSeconds,
              level: userLevel, // 更新用户段位
              lastUpdateTime: formattedDate
            }
          }).then(() => {
            resolve({
              status: hasAccumulateData ? 'updated' : 'created'
            });
          }).catch(err => {
            console.error('更新用户累积数据失败:', err);
            reject(err);
          });
        } else {
          // 不需要更新
          resolve({
            status: 'noChange'
          });
        }
      }).catch(err => {
        console.error('获取用户训练记录失败:', err);
        reject(err);
      });
    });
  },
  
  // 分页获取所有训练记录
  getAllTrainingRecords: async function(db, query) {
    const MAX_LIMIT = 100; // 微信云开发单次查询最大100条记录
    let records = [];
    
    try {
      // 先获取总数
      const countResult = await db.collection('trainlog').where(query).count();
      const total = countResult.total;
      console.log(`该用户训练记录总数：${total}`);
      
      // 如果没有记录，直接返回空数组
      if (total === 0) {
        return [];
      }
      
      // 计算需要分几次获取
      const batchTimes = Math.ceil(total / MAX_LIMIT);
      console.log(`需要分${batchTimes}次获取训练记录`);
      
      // 分批次获取数据
      const tasks = [];
      for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('trainlog')
          .where(query)
          .skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get();
        tasks.push(promise);
      }
      
      // 等待所有请求完成
      const results = await Promise.all(tasks);
      
      // 合并结果
      results.forEach(res => {
        records = records.concat(res.data);
      });
      
      console.log(`成功获取该用户的全部${records.length}条训练记录`);
      return records;
    } catch (err) {
      console.error(`获取训练记录失败:`, err);
      return [];
    }
  },

  onShareAppMessage: function () {
    return {
      title: '禅修训练',
      path: '/pages/index/index'
    }
  },

  // 添加navigateBack方法
  navigateBack: function() {
    wx.navigateBack();
  },

  // 查看用户训练记录
  viewUserTraining: function() {
    const user = this.data.selectedUser;
    if (user) {
      wx.navigateTo({
        url: `/pages/admin/user-training/user-training?userId=${user._id}`
      });
    }
  },
  
  // 检查用户数据一致性
  checkUserDataConsistency: function() {
    const db = app.globalData.db;
    
    wx.showLoading({
      title: '正在检查...',
    });
    
    // 创建一个Map来存储所有userinfo中的openId
    const userInfoOpenIds = new Map();
    
    // 分页获取所有用户信息
    this.getAllUsers(db).then(users => {
      console.log(`获取到${users.length}个用户信息`);
      
      // 处理用户信息
      users.forEach(user => {
        const openId = user.openId || user._openid;
        if (openId) {
          userInfoOpenIds.set(openId, true);
        }
      });
      
      // 分页获取所有训练记录
      return this.getAllTrainLogs(db);
    }).then(trainRecords => {
      console.log(`获取到${trainRecords.length}条训练记录`);
      
      // 找出trainlog中有但userinfo中没有的openId
      const missingOpenIds = [];
      
      trainRecords.forEach(record => {
        if (record.openId && !userInfoOpenIds.has(record.openId)) {
          // 记录不存在于userinfo中的openId
          if (!missingOpenIds.includes(record.openId)) {
            missingOpenIds.push(record.openId);
          }
        }
      });
      
      wx.hideLoading();
      
      // 显示检查结果
      if (missingOpenIds.length > 0) {
        wx.showModal({
          title: '数据不一致',
          content: `发现${missingOpenIds.length}个openId在训练记录中存在但在用户信息中不存在！`,
          showCancel: false
        });
      } else {
        wx.showToast({
          title: '数据一致性检查通过',
          icon: 'success'
        });
      }
    }).catch(err => {
      console.error('检查数据一致性失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '检查失败',
        icon: 'none'
      });
    });
  },
  
  // 分页获取所有用户
  getAllUsers: async function(db) {
    const MAX_LIMIT = 100; // 微信云开发单次查询最大100条记录
    let users = [];
    
    try {
      // 先获取总数
      const countResult = await db.collection('userinfo').count();
      const total = countResult.total;
      console.log(`用户总数：${total}`);
      
      // 如果没有用户，直接返回空数组
      if (total === 0) {
        return [];
      }
      
      // 计算需要分几次获取
      const batchTimes = Math.ceil(total / MAX_LIMIT);
      console.log(`需要分${batchTimes}次获取用户信息`);
      
      // 分批次获取数据
      const tasks = [];
      for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('userinfo')
          .skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get();
        tasks.push(promise);
      }
      
      // 等待所有请求完成
      const results = await Promise.all(tasks);
      
      // 合并结果
      results.forEach(res => {
        users = users.concat(res.data);
      });
      
      console.log(`成功获取${users.length}个用户信息`);
      return users;
    } catch (err) {
      console.error(`获取用户信息失败:`, err);
      return [];
    }
  },
  
  // 分页获取所有训练记录
  getAllTrainLogs: async function(db) {
    const MAX_LIMIT = 100; // 微信云开发单次查询最大100条记录
    let records = [];
    
    try {
      // 先获取总数
      const countResult = await db.collection('trainlog').count();
      const total = countResult.total;
      console.log(`训练记录总数：${total}`);
      
      // 计算需要分几次获取
      const batchTimes = Math.ceil(total / MAX_LIMIT);
      console.log(`需要分${batchTimes}次获取训练记录`);
      
      // 分批次获取数据
      const tasks = [];
      for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('trainlog')
          .field({ openId: true }) // 只获取openId字段，减少数据传输
          .skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get();
        tasks.push(promise);
      }
      
      // 等待所有请求完成
      const results = await Promise.all(tasks);
      
      // 合并结果
      results.forEach(res => {
        records = records.concat(res.data);
      });
      
      console.log(`成功获取全部${records.length}条训练记录`);
      return records;
    } catch (err) {
      console.error('获取所有训练记录失败:', err);
      return [];
    }
  },

  // 更新所有用户的段位
  updateAllUsersLevel: function() {
    const db = app.globalData.db;
    
    wx.showModal({
      title: '更新所有用户段位',
      content: '此操作将根据每个用户的累积训练时间计算并更新所有用户的段位。确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          this.performUpdateAllUsersLevel();
        }
      }
    });
  },
  
  // 执行批量更新所有用户段位
  performUpdateAllUsersLevel: function() {
    const db = app.globalData.db;
    
    wx.showLoading({
      title: '准备更新段位...',
    });
    
    this.setData({
      isUpdatingAllUsers: true,
      updateProgress: 0
    });
    
    // 先获取所有用户
    db.collection('userinfo').count().then(res => {
      const totalUsers = res.total;
      this.setData({
        totalUsersToUpdate: totalUsers
      });
      
      // 由于云函数一次最多获取20条记录，需要分批获取
      const batchTimes = Math.ceil(totalUsers / 20);
      let userProcessed = 0;
      
      // 创建批次处理任务
      const tasks = [];
      for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('userinfo')
          .skip(i * 20)
          .limit(20)
          .get();
        tasks.push(promise);
      }
      
      // 串行处理每个批次
      this.processLevelBatchTasks(tasks, 0, []);
    }).catch(err => {
      console.error('获取用户总数失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
      this.setData({
        isUpdatingAllUsers: false
      });
    });
  },
  
  // 串行处理批次任务(段位更新专用)
  processLevelBatchTasks: function(tasks, index, allUsers) {
    if (index >= tasks.length) {
      // 所有批次已获取，开始处理用户数据
      wx.hideLoading();
      this.processAllUsersLevel(allUsers);
      return;
    }
    
    wx.showLoading({
      title: `获取用户 ${index+1}/${tasks.length}`,
    });
    
    tasks[index].then(res => {
      const users = res.data;
      allUsers = allUsers.concat(users);
      
      // 处理下一批次
      this.processLevelBatchTasks(tasks, index + 1, allUsers);
    }).catch(err => {
      console.error('获取用户批次失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取用户失败',
        icon: 'none'
      });
      this.setData({
        isUpdatingAllUsers: false
      });
    });
  },
  
  // 处理所有用户的段位更新
  processAllUsersLevel: function(users) {
    const db = app.globalData.db;
    const totalUsers = users.length;
    let processedCount = 0;
    
    // 创建进度显示
    const progressModal = wx.showToast({
      title: `处理中: 0/${totalUsers}`,
      icon: 'loading',
      duration: 1000000 // 设置超长时间
    });
    
    // 串行处理每个用户，避免并发请求过多
    this.processNextUserLevel(users, 0, totalUsers, processedCount, {
      updated: 0,
      noChange: 0,
      error: 0
    });
  },
  
  // 递归处理下一个用户段位
  processNextUserLevel: function(users, index, totalUsers, processedCount, stats) {
    if (index >= totalUsers) {
      // 所有用户处理完毕
      wx.hideToast();
      this.setData({
        isUpdatingAllUsers: false,
        updateProgress: 100
      });
      
      wx.showModal({
        title: '段位更新完成',
        content: `共处理 ${totalUsers} 个用户:\n更新: ${stats.updated} 个\n无变化: ${stats.noChange} 个\n失败: ${stats.error} 个`,
        showCancel: false,
        success: (res) => {
          // 刷新当前用户列表
          this.loadUsers();
        }
      });
      return;
    }
    
    // 更新进度
    processedCount++;
    const progress = Math.floor((processedCount / totalUsers) * 100);
    this.setData({
      updateProgress: progress
    });
    
    // 显示进度
    wx.showToast({
      title: `处理中: ${processedCount}/${totalUsers}`,
      icon: 'loading',
      duration: 1000000
    });
    
    const user = users[index];
    this.updateUserLevel(user).then(result => {
      // 更新统计
      stats[result.status]++;
      
      // 处理下一个用户
      setTimeout(() => {
        this.processNextUserLevel(users, index + 1, totalUsers, processedCount, stats);
      }, 100);  // 适当延迟，避免请求过快
    }).catch(err => {
      console.error('更新用户段位失败:', err);
      stats.error++;
      
      // 处理下一个用户
      setTimeout(() => {
        this.processNextUserLevel(users, index + 1, totalUsers, processedCount, stats);
      }, 100);
    });
  },
  
  // 更新单个用户的段位
  updateUserLevel: function(user) {
    return new Promise((resolve, reject) => {
      const db = app.globalData.db;
      const userId = user._id;
      
      // 计算总分钟数
      const accumulateMuyuTime = user.accumulateMuyuTime || 0;
      const accumulateSongboTime = user.accumulateSongboTime || 0;
      const totalSeconds = accumulateMuyuTime + accumulateSongboTime;
      const totalMinutes = Math.ceil(totalSeconds / 60);
      
      // 计算用户段位
      const userLevel = calculateUserLevel(totalMinutes);
      
      // 检查是否需要更新
      if (user.level === userLevel) {
        // 段位未变化，不需要更新
        resolve({
          status: 'noChange'
        });
        return;
      }
      
      // 更新用户段位
      db.collection('userinfo').doc(userId).update({
        data: {
          level: userLevel
        }
      }).then(() => {
        resolve({
          status: 'updated'
        });
      }).catch(err => {
        console.error('更新用户段位失败:', err);
        reject(err);
      });
    });
  },
}) 