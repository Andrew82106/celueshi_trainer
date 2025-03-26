// app.js
App({
  globalData: {
    userInfo: null,
    isGuest: false, // 新增游客模式标识
    glmApiKey: '33b333df733a7ba7174034ef5d757c8f.1MlCkHLb22BysIPi', // 请替换为实际API Key
    glmBaseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', // 修正API地址
    
    // 木鱼统计数据
    muyuRecords: {},       // 木鱼按日期记录的数据
    muyuTodayCount: 0,     // 今日木鱼敲击次数
    muyuTotalCount: 0,     // 总木鱼敲击次数
    
    // 颂钵统计数据
    songboRecords: {},     // 颂钵按日期记录的数据 
    songboTodayCount: 0,   // 今日颂钵敲击次数
    songboTotalCount: 0    // 总颂钵敲击次数
  },

  onLaunch() {
    // 如果是下载 SDK 的方式，改成 const { init } = require('./wxCloudClientSDK.umd.js')
    const { init } = require("./wxCloudClientSDK.umd.js");

    // 指定云开发环境 ID
    wx.cloud.init({
      env: "shanmen-2g47tf5h9b090d06", // 当前的云开发环境 ID
      traceUser: true
    });
    const client = init(wx.cloud);
    // const models = client.models; // 或者也可以直接从 wx.cloud.models 上获取，这种方式的类型提示会弱一些
    this.globalData.cloud = client; // 挂载到全局
    this.globalData.models = client.models;
    this.globalData.db = wx.cloud.database();

    console.log("in app.js debug: 完成云环境初始化，已将client和database挂载到全局")
    /*console.log("开始测试database")
    this.globalData.db.collection("userinfo").get({
        success: res=>{
            console.log(res)
        }
    })

    console.log("测试database end")*/
    // 初始化木鱼和颂钵的记录数据
    this.initStatisticsData();

    console.log("in app.js debug: 初始化木鱼和颂钵的记录数据")
    
    // 设置默认游客信息
    this.globalData.userInfo = {
      nickName: '游客',
      isTourist: true,
      isLogin: false,
      isAdmin: false
    };
    console.log("in app.js debug: 设置默认游客信息")
    
    // 检查本地存储是否有用户信息
    const localUserInfo = wx.getStorageSync('userInfo');

    console.log("in app.js debug: 检查本地存储是否有用户信息")
    console.log(localUserInfo)
    console.log("in app.js debug: 检查本地存储是否有用户信息 end")

    if (localUserInfo) {
      this.globalData.userInfo = localUserInfo;
      
      // 调用云函数获取用户openID
      wx.cloud.callFunction({
        name: 'fetchwxinfo',
        success: res => {
          console.log("in app.js debug: 获取用户openId成功");
          console.log(res);
          const openId = res.result.openid;
          this.globalData.userInfo.openId = openId;
          
          // 获取到openId后，查询数据库中是否存在该用户
          this.globalData.db.collection("userinfo").where({
            openId: openId
          }).get().then(res => {
            console.log("in app.js debug: 查询用户信息成功");
            console.log(res);
            
            if (res.data && res.data.length > 0) {
              // 用户已存在，从数据库获取用户信息
              const userInfo = res.data[0];
              const nickname = userInfo.nickName || "未命名用户";
              const avatarUrl = userInfo.avatarUrl || "None";
              // 更新全局数据
              this.globalData.userInfo.nickName = nickname;
              this.globalData.userInfo.avatarUrl = avatarUrl;
              
              // 检查是否需要更新数据库中的信息
              if (!userInfo.nickName || !userInfo.avatarUrl) {
                this.globalData.db.collection("userinfo").where({
                  openId: openId
                }).update({
                  data: {
                    nickName: nickname,
                    avatarUrl: avatarUrl
                  }
                }).then(updateRes => {
                  console.log("in app.js debug: 更新用户信息成功");
                  console.log(updateRes);
                }).catch(err => {
                  console.log("in app.js debug: 更新用户信息失败");
                  console.log(err);
                });
              }
            } else {
              // 用户不存在，创建新用户
              // 从云端获取用户的昵称和头像
              const nickname = this.globalData.userInfo.nickName || "未命名用户";
              const avatarUrl = this.globalData.userInfo.avatarUrl || "None";
              
              this.globalData.db.collection("userinfo").add({
                data: {
                  openId: openId,
                  nickName: nickname,
                  avatarUrl: avatarUrl
                }
              }).then(addRes => {
                console.log("in app.js debug: 创建用户信息成功");
                console.log(addRes);
              }).catch(err => {
                console.log("in app.js debug: 创建用户信息失败");
                console.log(err);
              });
            }
          }).catch(err => {
            console.log("in app.js debug: 查询用户信息失败");
            console.log(err);
          });
        },
        fail: err => {
          console.log("in app.js debug: 获取用户openId失败");
          console.log(err);
          wx.showToast({
            title: '获取用户openId失败',
            icon: 'none'
          });
        }
      });
    } else {
      console.log("in app.js debug: 本地没有用户信息，用游客模式");
      this.globalData.userInfo = {
        nickName: '游客',
        isTourist: true,
        isLogin: false,
        isAdmin: false
      };
      console.log("in app.js debug: 设置默认游客信息");
      console.log(this.globalData.userInfo);
    }
    
  },

  checkLogin() {
    return new Promise((resolve) => {
      if (this.globalData.userInfo && this.globalData.userInfo.isLogin) return resolve(true);
      const user = wx.getStorageSync('userInfo');
      
      if (user && user.isLogin) {
        this.globalData.userInfo = user;
        resolve(true);
      } else {
        resolve(false);
      }
    });
  },

  // 初始化统计数据
  initStatisticsData() {
    // 获取木鱼记录
    const muyuRecords = wx.getStorageSync('muyuRecords') || {};
    this.globalData.muyuRecords = muyuRecords;
    
    // 获取颂钵记录
    const songboRecords = wx.getStorageSync('songboRecords') || {};
    this.globalData.songboRecords = songboRecords;
    
    // 获取今天的日期
    const today = this.getTodayDateString();
    
    // 计算木鱼今日次数和总次数
    this.globalData.muyuTodayCount = muyuRecords[today] || 0;
    let muyuTotal = 0;
    for (const date in muyuRecords) {
      muyuTotal += muyuRecords[date];
    }
    this.globalData.muyuTotalCount = muyuTotal;
    
    // 计算颂钵今日次数和总次数
    this.globalData.songboTodayCount = songboRecords[today] || 0;
    let songboTotal = 0;
    for (const date in songboRecords) {
      songboTotal += songboRecords[date];
    }
    this.globalData.songboTotalCount = songboTotal;
  },
  
  // 获取今天的日期字符串 (YYYY-MM-DD)
  getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
})
