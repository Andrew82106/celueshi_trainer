const app = getApp()

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    avatarUrl: defaultAvatarUrl,
    theme: wx.getSystemInfoSync().theme,
    userInfo: null,
    nickName: '',
    isLoading: false
  },
  
  onLoad() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    // 调用云函数获取用户openID
    wx.cloud.callFunction({
      name: 'fetchwxinfo',
      success: res=>{
        console.log("登录页面获取到用户openID:", res.result.openid);
        userInfo.openId = res.result.openid;
      },
      fail: err=>{
        console.log("登录页面获取用户openID失败:", err);
      }
    })
    
    console.log("登录页面获取到用户信息:", userInfo);
    if (userInfo.isTourist) {
      userInfo.nickName = "";
    }
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        avatarUrl: userInfo.avatarUrl || defaultAvatarUrl,
        nickName: userInfo.nickName || '',
      });
    }

    console.log("登录页面获取到用户信息（清空姓名后）:", userInfo);
    
    wx.onThemeChange((result) => {
      this.setData({
        theme: result.theme
      });
    });
  },
  
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log("选择的头像:", avatarUrl);
    this.setData({
      avatarUrl,
    });
  },
  
  onInput(e) {
    const value = e.detail.value;
    console.log("输入的昵称:", value);
    this.setData({
      nickName: value
    });
  },
  
  onSubmit(e) {
    if (this.data.isLoading) return;
    
    const { nickName, avatarUrl } = this.data;
    console.log("提交的昵称和头像:", nickName, avatarUrl);
    
    if (!nickName || nickName.length < 2 || nickName.length > 10) {
      wx.showToast({
        title: '昵称长度为2-10个字符',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isLoading: true });
    
    // 获取当前存储的用户信息
    const baseUserInfo = this.data.userInfo || {};
    
    // 更新用户信息
    const userInfo = {
      ...baseUserInfo,
      nickName: nickName,
      avatarUrl: avatarUrl,
      isLogin: true,
      isTourist: false
    };
    
    // 更新全局和本地存储
    app.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);

    // 将用户信息更新到数据库
    // 先检查是否存在该用户
    app.globalData.db.collection("userinfo").where({
      openId: userInfo.openId
    }).get().then(res => {
      if (res.data.length > 0) {
        // 存在该用户，更新用户信息
        app.globalData.db.collection("userinfo").doc(res.data[0]._id).update({
          data: {
            nickName: nickName,
            avatarUrl: avatarUrl
          }
        }).then(updateRes => {
          console.log("登录页面更新用户信息成功:", updateRes);
          wx.showToast({
            title: '信息更新成功',
            icon: 'success'
          });
          // 更新成功后跳转到首页
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 1500);
        }).catch(err => {
          console.log("登录页面更新用户信息失败:", err);
          this.setData({ isLoading: false });
          wx.showToast({
            title: '更新失败，请重试',
            icon: 'none'
          });
        });
      } else {
        // 不存在该用户，创建新用户
        app.globalData.db.collection("userinfo").add({
          data: {
            openId: userInfo.openId,
            nickName: nickName,
            avatarUrl: avatarUrl
          }
        }).then(addRes => {
          console.log("登录页面创建用户信息成功:", addRes);
          wx.showToast({
            title: '账号创建成功',
            icon: 'success'
          });
          // 创建成功后跳转到首页
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 1500);
        }).catch(err => {
          console.log("登录页面创建用户信息失败:", err);
          this.setData({ isLoading: false });
          wx.showToast({
            title: '创建失败，请重试',
            icon: 'none'
          });
        });
      }
    }).catch(err => {
      console.log("登录页面查询用户信息失败:", err);
      this.setData({ isLoading: false });
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    });
  }
})
