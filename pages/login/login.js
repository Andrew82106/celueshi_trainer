const app = getApp()

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    avatarUrl: defaultAvatarUrl,
    theme: wx.getSystemInfoSync().theme,
    userInfo: null,
    nickName: '',
    isLoading: false,
    cloudAvatarUrl: ''
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
        cloudAvatarUrl: userInfo.avatarUrl || ''
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
      isLoading: true
    });
    
    const openId = this.data.userInfo.openId || 'unknown';
    const cloudPath = `avatars/${openId}_${new Date().getTime()}.jpg`;
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: avatarUrl,
      success: res => {
        console.log("头像上传成功:", res);
        const fileID = res.fileID;
        this.setData({
          cloudAvatarUrl: fileID,
          isLoading: false
        });
        
        wx.showToast({
          title: '头像上传成功',
          icon: 'success'
        });
      },
      fail: err => {
        console.error("头像上传失败:", err);
        this.setData({
          isLoading: false
        });
        wx.showToast({
          title: '头像上传失败',
          icon: 'none'
        });
      }
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
    
    const { nickName, cloudAvatarUrl, avatarUrl } = this.data;
    console.log("提交的昵称和头像:", nickName, cloudAvatarUrl || avatarUrl);
    
    if (!nickName || nickName.length < 2 || nickName.length > 10) {
      wx.showToast({
        title: '昵称长度为2-10个字符',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isLoading: true });
    
    const baseUserInfo = this.data.userInfo || {};
    
    const finalAvatarUrl = cloudAvatarUrl || avatarUrl;
    
    const userInfo = {
      ...baseUserInfo,
      nickName: nickName,
      avatarUrl: finalAvatarUrl,
      isLogin: true,
      isTourist: false
    };
    
    app.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);

    app.globalData.db.collection("userinfo").where({
      openId: userInfo.openId
    }).get().then(res => {
      if (res.data.length > 0) {
        app.globalData.db.collection("userinfo").doc(res.data[0]._id).update({
          data: {
            nickName: nickName,
            avatarUrl: finalAvatarUrl
          }
        }).then(updateRes => {
          console.log("登录页面更新用户信息成功:", updateRes);
          wx.showToast({
            title: '信息更新成功',
            icon: 'success'
          });
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
        app.globalData.db.collection("userinfo").add({
          data: {
            openId: userInfo.openId,
            nickName: nickName,
            avatarUrl: finalAvatarUrl
          }
        }).then(addRes => {
          console.log("登录页面创建用户信息成功:", addRes);
          wx.showToast({
            title: '账号创建成功',
            icon: 'success'
          });
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
