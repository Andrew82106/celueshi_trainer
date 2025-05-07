const app = getApp();

Page({
    data: {
        userInfo: {}
    },

    onLoad(options) {
        if (app.globalData.userInfo) {
            // 从数据库获取最新的用户信息进行权限验证
            app.globalData.db.collection("userinfo")
                .where({
                    openId: app.globalData.userInfo.openId
                })
                .get()
                .then(res => {
                    if (res.data && res.data.length > 0 && res.data[0].admin === true) {
                        this.setData({
                            userInfo: res.data[0]
                        });
                    } else {
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
                })
                .catch(err => {
                    console.error("获取用户信息失败:", err);
                    wx.navigateBack();
                });
        } else {
            wx.navigateBack();
        }
    },

    // 导航到用户管理页面
    navigateToUserManagement() {
        wx.navigateTo({
            url: '/packageTrain/pages/admin/user-management/user-management'
        });
    },

    // 导航到训练记录查看页面
    navigateToTrainingRecords() {
        wx.navigateTo({
            url: '/packageTrain/pages/admin/training-records/training-records'
        });
    },

    navigateBack() {
        wx.navigateBack();
    },

    onShareAppMessage() {
        return {
            title: '禅修训练',
            path: '/pages/index/index'
        };
    }
}); 