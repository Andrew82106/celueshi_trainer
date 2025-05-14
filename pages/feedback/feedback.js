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
    // 设置背景图片，如果传入了背景图片参数则使用，否则使用默认的
    this.setData({
      currentBackground: options.background || BACKGROUND_IMAGES[0]
    });
    
    // 获取用户的反馈历史
    this.getFeedbackHistory();
    // 获取所有用户的反馈
    this.getAllFeedbacks();
    // 检查是否是管理员
    this.checkAdminStatus();
  },

  // 检查用户是否是管理员
  checkAdminStatus: function() {
    // 获取当前用户信息
    if (app.globalData && app.globalData.userInfo) {
      // 直接使用全局存储的用户信息
      this.setData({
        isAdmin: app.globalData.userInfo.admin === true
      });
    } else {
      // 从数据库获取用户信息
      wx.cloud.callFunction({
        name: 'fetchwxinfo',
        success: res => {
          const openId = res.result.openid;
          
          const db = wx.cloud.database();
          db.collection('userinfo')
            .where({
              openId: openId
            })
            .get()
            .then(res => {
              if (res.data && res.data.length > 0) {
                const userInfo = res.data[0];
                this.setData({
                  isAdmin: userInfo.admin === true
                });
                
                // 更新全局状态
                if (app.globalData) {
                  app.globalData.userInfo = userInfo;
                }
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

  // 切换选项卡
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    
    // 切换到"所有反馈"时，重新加载所有反馈数据
    if (tab === 'all' && this.data.allFeedbacks.length === 0) {
      this.getAllFeedbacks();
    }
    
    // 切换到"我的反馈"时，重新加载我的反馈历史
    if (tab === 'my' && this.data.feedbackHistory.length === 0) {
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
    
    // 获取当前时间
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    
    // 使用现有的fetchwxinfo云函数获取用户openid
    wx.cloud.callFunction({
      name: 'fetchwxinfo',
      success: res => {
        const openId = res.result.openid;
        
        // 创建反馈数据
        const feedbackData = {
          openId: openId, // 使用云函数获取的可靠的openid
          Time: timeString,
          content: content,
          feedback: '',
          feedbackAdminOpenID: '',
          feedbackTime: ''
        };
        
        // 使用原生JS操作数据库添加反馈
        const db = wx.cloud.database();
        db.collection('feedback').add({
          data: feedbackData,
          success: res => {
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
            console.error('提交反馈失败:', err);
            wx.showToast({
              title: '提交失败，请检查网络',
              icon: 'none'
            });
          }
        });
      },
      fail: err => {
        wx.hideLoading();
        console.error('获取openid失败:', err);
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
        const openId = res.result.openid;
        
        // 使用获取到的openId查询反馈历史
        const db = wx.cloud.database();
        db.collection('feedback')
          .where({
            openId: openId
          })
          .get({
            success: res => {
              if (res.data && res.data.length > 0) {
                // 按时间倒序排列
                const sortedData = res.data.sort((a, b) => {
                  return new Date(b.Time) - new Date(a.Time);
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
    
    db.collection('feedback')
      .orderBy('Time', 'desc')
      .skip(this.data.currentPage * this.data.pageSize)
      .limit(this.data.pageSize)
      .get({
        success: res => {
          wx.hideLoading();
          
          if (res.data && res.data.length > 0) {
            // 获取用户昵称信息
            this.enrichFeedbacksWithUserInfo(res.data);
            
            // 判断是否还有更多数据
            const hasMore = res.data.length === this.data.pageSize;
            
            this.setData({
              allFeedbacks: [...this.data.allFeedbacks, ...res.data],
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
    const openIds = feedbacks.map(item => item.openId);
    const uniqueOpenIds = [...new Set(openIds)];
    
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
        if (res.data && res.data.length > 0) {
          // 建立openId到用户信息的映射
          const userMap = {};
          res.data.forEach(user => {
            userMap[user.openId] = user;
          });
          
          // 更新反馈数据，添加用户昵称
          const updatedFeedbacks = this.data.allFeedbacks.map(feedback => {
            const user = userMap[feedback.openId];
            if (user) {
              return {
                ...feedback,
                nickName: user.nickName || '匿名用户'
              };
            }
            return feedback;
          });
          
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

    wx.showLoading({
      title: '提交中...',
    });

    // 获取当前时间
    const now = new Date();
    const timeString = now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
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
        
        // 更新数据库
        const db = wx.cloud.database();
        db.collection('feedback').doc(feedbackId).update({
          data: {
            feedback: content,
            feedbackAdminOpenID: adminOpenId,
            feedbackTime: timeString
          },
          success: res => {
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
          },
          fail: err => {
            wx.hideLoading();
            console.error('提交回复失败:', err);
            wx.showToast({
              title: '回复失败，请重试',
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