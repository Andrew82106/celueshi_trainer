const app = getApp()

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'


Page({
  data: {
    avatarUrl: defaultAvatarUrl,
    theme: wx.getSystemInfoSync().theme,
    userInfo: null
  },
  onLoad() {
    const user = wx.getStorageSync('userInfo');
    console.log("in login.js")
    console.log(user)
    if (user) {
      this.setData({
        userInfo: user,
        avatarUrl: user.avatarUrl || defaultAvatarUrl
      });
    }
    wx.onThemeChange((result) => {
      this.setData({
        theme: result.theme
      })
    })
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    console.log(avatarUrl)
    this.setData({
      avatarUrl,
    })
  },
  onInput(e) {
    console.log(e.detail.value)
    this.setData({
      nickName: e.detail.value
    })
  },
  onSubmit(e) {
    const { nickName, avatarUrl } = this.data
    console.log(nickName, avatarUrl)
    
    if (!nickName || nickName.length < 2 || nickName.length > 10) {
      wx.showToast({
        title: '昵称长度为2-10个字符',
        icon: 'none'
      })
      return
    }
    
    const userInfo = {
      ...this.data.userInfo,
      nickName: nickName,
      avatarUrl: avatarUrl
    };
    //将userInfo中添加一个字段，用于记录是否登录
    userInfo.isLogin = true;
    userInfo.isTourist = false;
    
    app.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
    
    wx.reLaunch({ url: '/pages/index/index' });
  }
})
