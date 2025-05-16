const app = getApp()
import { BACKGROUND_IMAGES } from '../profileshanmen/constants/index';

Page({
  data: {
    currentBackground: BACKGROUND_IMAGES[0], // 使用常量中定义的背景图片
    feedbackContent: '',
    contentLength: 0,
    feedbackHistory: [],
    allFeedbacks: [],
    activeTab: 'submit', // 默认选项卡：提交反馈
    hasMoreFeedbacks: true, // 是否有更多反馈数据
    pageSize: 10, // 每次加载的反馈数量
    currentPage: 0, // 当前加载的页数
    isAdmin: false, // 是否是管理员
    showReplyModal: false, // 是否显示回复模态框
    currentFeedback: {}, // 当前选中的反馈
    replyContent: '', // 回复内容
    replyLength: 0 // 回复内容长度
  },

  onLoad: function(options) {
    console.log('========== 页面加载 onLoad ==========');
    
    // 设置背景图片，如果传入了背景图片参数则使用，否则使用默认的
    this.setData({
      currentBackground: options.background || BACKGROUND_IMAGES[0]
    });
    
    console.log('开始检查管理员身份...');
    // 检查是否是管理员
    this.checkAdminStatus();
    
    console.log('开始获取用户反馈历史...');
    // 获取用户的反馈历史
    this.getFeedbackHistory();
    
    console.log('开始获取所有用户反馈...');
    // 获取所有用户的反馈
    this.getAllFeedbacks();
  },

  // 检查用户是否是管理员
  checkAdminStatus: function() {
    console.log('========== 开始检查管理员身份 ==========');
    
    // 获取当前用户信息
    if (app.globalData && app.globalData.userInfo) {
      // 直接使用全局存储的用户信息
      console.log('从全局获取用户信息:', app.globalData.userInfo);
      console.log('用户管理员状态:', app.globalData.userInfo.admin);
      
      // 只检查admin字段
      this.setData({
        isAdmin: app.globalData.userInfo.admin === true
      });
      
      console.log('设置isAdmin为:', this.data.isAdmin);
    } else {
      console.log('全局没有用户信息，从数据库获取');
      // 从数据库获取用户信息
      wx.cloud.callFunction({
        name: 'fetchwxinfo',
        success: res => {
          const openid = res.result.openid;
          console.log('获取到的openid:', openid);
          
          const db = wx.cloud.database();
          db.collection('userinfo')
            .where({
              openid: openid
            })
            .get()
            .then(res => {
              console.log('数据库中的用户信息:', res.data);
              
              if (res.data && res.data.length > 0) {
                const userInfo = res.data[0];
                console.log('用户数据:', userInfo);
                console.log('用户管理员状态:', userInfo.admin);
                
                // 只检查admin字段
                this.setData({
                  isAdmin: userInfo.admin === true
                });
                
                console.log('设置isAdmin为:', this.data.isAdmin);
                
                // 更新全局状态
                if (app.globalData) {
                  app.globalData.userInfo = userInfo;
                  console.log('已更新全局用户信息:', app.globalData.userInfo);
                }
              } else {
                console.log('数据库中未找到用户信息');
                
                // 手动再次检查是否为管理员
                this.checkAdminManually(openid);
              }
            })
            .catch(err => {
              console.error('获取用户信息失败:', err);
            });
        },
        fail: err => {
          console.error('获取openid失败:', err);
        }
      });
    }
  },
  
  // 手动检查是否为管理员（备用方法）
  checkAdminManually: function(openid) {
    console.log('尝试手动检查管理员身份，openid:', openid);
    
    // 管理员openid列表
    const adminOpenIds = [
      'om9Tz651sF-sA0pmsgPCy7d6TNVI', // 添加用户的openid
      'om9Tz66FJoIB6Ixivux53yvvasPI'
    ];
    
    const isAdmin = adminOpenIds.includes(openid);
    console.log('手动检查结果 - 是否为管理员:', isAdmin);
    
    this.setData({
      isAdmin: isAdmin
    });
    
    // 更新全局状态，只设置admin字段
    if (app.globalData && app.globalData.userInfo) {
      app.globalData.userInfo.admin = isAdmin;
      console.log('已手动更新全局用户管理员状态');
    }
  },

  // 切换选项卡
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log('========== 切换选项卡 ==========');
    console.log('选择的标签:', tab);
    console.log('当前管理员状态:', this.data.isAdmin);
    
    this.setData({
      activeTab: tab
    });
    
    // 切换到"所有反馈"时，重新加载所有反馈数据
    if (tab === 'all' && this.data.allFeedbacks.length === 0) {
      console.log('切换到所有反馈标签，加载所有反馈');
      this.getAllFeedbacks();
    }
    
    // 切换到"我的反馈"时，重新加载我的反馈历史
    if (tab === 'my' && this.data.feedbackHistory.length === 0) {
      console.log('切换到我的反馈标签，加载我的反馈历史');
      this.getFeedbackHistory();
    }
  },

  onContentInput: function(e) {
    // 更新输入内容和字数统计
    this.setData({
      feedbackContent: e.detail.value,
      contentLength: e.detail.value.length
    });
  },

  submitFeedback: function() {
    const content = this.data.feedbackContent;
    
    if (!content.trim()) {
      wx.showToast({
        title: '反馈内容不能为空',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '提交中...',
    });
    
    console.log('开始提交反馈...');
    
    // 获取当前时间，格式化为 iOS 兼容格式
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    // 使用 yyyy/MM/dd HH:mm:ss 格式，确保 iOS 兼容
    const timeString = `${year}/${month}/${day} ${hour}:${minute}:${second}`;
    
    console.log('格式化的时间字符串:', timeString);
    
    // 使用现有的fetchwxinfo云函数获取用户openid
    wx.cloud.callFunction({
      name: 'fetchwxinfo',
      success: res => {
        const openid = res.result.openid;
        console.log('获取到用户openid:', openid);
        
        // 创建反馈数据
        const feedbackData = {
          openId: openid, // 使用云函数获取的可靠的openid
          Time: timeString,
          content: content,
          feedback: '',
          feedbackAdminOpenID: '',
          feedbackTime: ''
        };
        
        console.log('准备提交的反馈数据:', feedbackData);
        
        // 使用原生JS操作数据库添加反馈
        const db = wx.cloud.database();
        console.log('开始向feedback集合添加数据...');
        db.collection('feedback').add({
          data: feedbackData,
          success: res => {
            console.log('提交反馈成功，返回结果:', res);
            wx.hideLoading();
            wx.showToast({
              title: '反馈提交成功',
              icon: 'success'
            });
            
            // 清空输入框
            this.setData({
              feedbackContent: '',
              contentLength: 0
            });
            
            // 刷新反馈数据
            this.getFeedbackHistory();
            this.getAllFeedbacks(true); // 重置并重新加载所有反馈
          },
          fail: err => {
            wx.hideLoading();
            console.error('提交反馈失败，完整错误:', err);
            console.error('错误信息:', err.errMsg || '未知错误');
            wx.showToast({
              title: '提交失败: ' + (err.errMsg || '请检查网络'),
              icon: 'none'
            });
          }
        });
      },
      fail: err => {
        wx.hideLoading();
        console.error('获取openid失败，完整错误:', err);
        console.error('错误信息:', err.errMsg || '未知错误');
        wx.showToast({
          title: '提交失败，无法获取用户信息',
          icon: 'none'
        });
      }
    });
  },
  
  getFeedbackHistory: function() {
    // 使用fetchwxinfo云函数获取当前用户的openid
    wx.cloud.callFunction({
      name: 'fetchwxinfo',
      success: res => {
        const openid = res.result.openid;
        
        // 使用获取到的openid查询反馈历史
        const db = wx.cloud.database();
        db.collection('feedback')
          .where({
            openId: openid
          })
          .get({
            success: res => {
              if (res.data && res.data.length > 0) {
                // 按时间倒序排列，使用安全的日期比较方式
                const sortedData = res.data.sort((a, b) => {
                  // 将日期字符串转换为标准格式后比较
                  const dateA = a.Time ? a.Time.replace(/-/g, '/') : '';
                  const dateB = b.Time ? b.Time.replace(/-/g, '/') : '';
                  
                  if (!dateA || !dateB) return 0;
                  
                  return new Date(dateB) - new Date(dateA);
                });
                
                this.setData({
                  feedbackHistory: sortedData
                });
              } else {
                this.setData({
                  feedbackHistory: []
                });
              }
            },
            fail: err => {
              console.error('获取反馈历史失败:', err);
            }
          });
      },
      fail: err => {
        console.error('获取openid失败:', err);
      }
    });
  },
  
  // 获取所有用户的反馈
  getAllFeedbacks: function(reset = false) {
    wx.showLoading({
      title: '加载中...',
    });
    
    console.log('获取所有反馈 - 重置:', reset);
    
    // 如果是重置，则重置页码和数据
    if (reset) {
      this.setData({
        currentPage: 0,
        allFeedbacks: [],
        hasMoreFeedbacks: true
      });
    }
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    console.log('获取所有反馈 - 页码:', this.data.currentPage, '每页数量:', this.data.pageSize);
    
    db.collection('feedback')
      .orderBy('Time', 'desc')
      .skip(this.data.currentPage * this.data.pageSize)
      .limit(this.data.pageSize)
      .get({
        success: res => {
          wx.hideLoading();
          
          console.log('获取反馈成功 - 数据:', res.data);
          
          if (res.data && res.data.length > 0) {
            // 确保每个反馈项都有_id字段
            const validData = res.data.map(item => {
              // 确保_id字段是字符串类型
              if (item._id && typeof item._id === 'object') {
                item._id = item._id.toString();
              }
              return item;
            });
            
            console.log('处理后的反馈数据:', validData);
            
            // 获取用户昵称信息
            this.enrichFeedbacksWithUserInfo(validData);
            
            // 判断是否还有更多数据
            const hasMore = res.data.length === this.data.pageSize;
            
            this.setData({
              allFeedbacks: [...this.data.allFeedbacks, ...validData],
              currentPage: this.data.currentPage + 1,
              hasMoreFeedbacks: hasMore
            });
          } else {
            // 没有更多数据
            this.setData({
              hasMoreFeedbacks: false
            });
            
            if (this.data.currentPage === 0) {
              // 如果是第一页且没有数据
              this.setData({
                allFeedbacks: []
              });
            }
          }
        },
        fail: err => {
          wx.hideLoading();
          console.error('获取所有反馈失败:', err);
          wx.showToast({
            title: '加载失败，请重试',
            icon: 'none'
          });
        }
      });
  },
  
  // 用户信息丰富反馈数据
  enrichFeedbacksWithUserInfo: function(feedbacks) {
    console.log('丰富反馈数据 - 输入数据:', feedbacks);
    
    if (!feedbacks || !Array.isArray(feedbacks) || feedbacks.length === 0) {
      console.log('没有需要丰富的反馈数据');
      return;
    }
    
    const openIds = feedbacks.map(item => item.openId).filter(id => id);
    const uniqueOpenIds = [...new Set(openIds)];
    
    console.log('丰富反馈数据 - 唯一OpenID数量:', uniqueOpenIds.length);
    
    if (uniqueOpenIds.length === 0) return;
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 批量查询用户信息
    db.collection('userinfo')
      .where({
        openId: _.in(uniqueOpenIds)
      })
      .get()
      .then(res => {
        console.log('获取用户信息成功:', res.data);
        
        if (res.data && res.data.length > 0) {
          // 建立openId到用户信息的映射
          const userMap = {};
          res.data.forEach(user => {
            if (user.openId) {
              userMap[user.openId] = user;
            }
          });
          
          console.log('用户信息映射:', userMap);
          
          // 更新反馈数据，添加用户昵称
          const updatedFeedbacks = this.data.allFeedbacks.map(feedback => {
            // 确保_id字段是字符串类型
            if (feedback._id && typeof feedback._id === 'object') {
              feedback._id = feedback._id.toString();
            }
            
            if (feedback.openId && userMap[feedback.openId]) {
              return {
                ...feedback,
                nickName: userMap[feedback.openId].nickName || '匿名用户'
              };
            }
            return feedback;
          });
          
          console.log('更新后的反馈数据:', updatedFeedbacks);
          
          this.setData({
            allFeedbacks: updatedFeedbacks
          });
        }
      })
      .catch(err => {
        console.error('获取用户信息失败:', err);
      });
  },
  
  // 加载更多反馈
  loadMoreFeedbacks: function() {
    if (this.data.hasMoreFeedbacks) {
      this.getAllFeedbacks();
    }
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },

  // 显示回复模态框
  showReplyModal: function(e) {
    const feedback = e.currentTarget.dataset.feedback;
    console.log('显示回复模态框 - 反馈数据:', feedback);
    
    // 确保有有效的反馈ID
    if (!feedback || !feedback._id) {
      console.error('无效的反馈数据:', feedback);
      wx.showToast({
        title: '无法回复，反馈数据无效',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showReplyModal: true,
      currentFeedback: feedback,
      replyContent: feedback.feedback || '',
      replyLength: feedback.feedback ? feedback.feedback.length : 0
    });
  },

  // 隐藏回复模态框
  hideReplyModal: function() {
    this.setData({
      showReplyModal: false,
      replyContent: '',
      replyLength: 0
    });
  },

  // 回复内容输入
  onReplyInput: function(e) {
    this.setData({
      replyContent: e.detail.value,
      replyLength: e.detail.value.length
    });
  },

  // 提交回复
  submitReply: function() {
    const content = this.data.replyContent.trim();
    if (!content) {
      wx.showToast({
        title: '请输入回复内容',
        icon: 'none'
      });
      return;
    }

    // 检查管理员权限
    if (!this.data.isAdmin) {
      console.error('非管理员尝试提交回复');
      wx.showToast({
        title: '您没有管理员权限',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '提交中...',
    });

    // 获取当前时间，使用 iOS 兼容格式
    const now = new Date();
    // 使用 yyyy/MM/dd HH:mm:ss 格式
    const timeString = now.getFullYear() + '/' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '/' + 
                      String(now.getDate()).padStart(2, '0') + ' ' + 
                      String(now.getHours()).padStart(2, '0') + ':' + 
                      String(now.getMinutes()).padStart(2, '0') + ':' + 
                      String(now.getSeconds()).padStart(2, '0');

    // 获取管理员openid
    wx.cloud.callFunction({
      name: 'fetchwxinfo',
      success: res => {
        const adminOpenId = res.result.openid;
        const feedbackId = this.data.currentFeedback._id;
        
        console.log('提交回复 - 反馈ID:', feedbackId);
        console.log('提交回复 - 管理员OpenID:', adminOpenId);
        console.log('提交回复 - 回复内容:', content);
        console.log('提交回复 - 回复时间:', timeString);
        console.log('提交回复 - 当前管理员状态:', this.data.isAdmin);
        console.log('提交回复 - 全局用户信息:', app.globalData.userInfo);
        
        // 检查是否有效的反馈ID
        if (!feedbackId) {
          wx.hideLoading();
          console.error('反馈ID无效:', this.data.currentFeedback);
          wx.showToast({
            title: '回复失败，反馈ID无效',
            icon: 'none'
          });
          return;
        }
        
        // 更新数据库
        const db = wx.cloud.database();
        console.log('提交回复 - 开始更新数据库，文档ID:', feedbackId);
        
        db.collection('feedback').doc(feedbackId).update({
          data: {
            feedback: content,
            feedbackAdminOpenID: adminOpenId,
            feedbackTime: timeString
          },
          success: res => {
            console.log('提交回复成功:', res);
            wx.hideLoading();
            wx.showToast({
              title: '回复成功',
              icon: 'success'
            });
            
            // 隐藏模态框
            this.hideReplyModal();
            
            // 更新本地数据
            const updatedFeedbacks = this.data.allFeedbacks.map(item => {
              if (item._id === feedbackId) {
                return {
                  ...item,
                  feedback: content,
                  feedbackAdminOpenID: adminOpenId,
                  feedbackTime: timeString
                };
              }
              return item;
            });
            
            this.setData({
              allFeedbacks: updatedFeedbacks
            });
            
            // 刷新反馈列表
            this.getAllFeedbacks(true);
          },
          fail: err => {
            wx.hideLoading();
            console.error('提交回复失败:', err);
            
            // 尝试获取更详细的错误信息
            let errorMsg = '回复失败，请重试';
            if (err && err.errMsg) {
              if (err.errMsg.indexOf('permission denied') > -1) {
                errorMsg = '权限不足，无法回复';
              } else if (err.errMsg.indexOf('document not exists') > -1) {
                errorMsg = '反馈记录不存在或已被删除';
              }
              console.error('错误详情:', err.errMsg);
            }
            
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            });
          }
        });
      },
      fail: err => {
        wx.hideLoading();
        console.error('获取openid失败:', err);
        wx.showToast({
          title: '回复失败，无法获取用户信息',
          icon: 'none'
        });
      }
    });
  }
}) 