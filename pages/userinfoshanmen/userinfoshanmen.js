const app = getApp();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        userId: '',           // 用户ID (实际是openId)
        userName: '',         // 用户名称
        userInfo: {},         // 用户信息
        totalTrainingMinutes: 0, // 累计训练时长(分钟)
        totalTapCount: 0,     // 累计敲击次数
        muyuMinutes: 0,       // 木鱼训练时长
        muyuCount: 0,         // 木鱼敲击次数
        songboMinutes: 0,     // 颂钵训练时长
        songboCount: 0,       // 颂钵敲击次数
        writingRecords: [],   // 用户公开的内观写作
        displayedWritings: [], // 用于显示的内观写作（可能被限制数量）
        lastLoginTime: '',    // 上一次登录时间
        isLoading: true,      // 数据加载状态
        isWritingsExpanded: false, // 内观写作是否展开
        showToggleBtn: false,  // 是否显示展开/收起按钮
        
        // 模态框相关
        showWritingModal: false, // 是否显示内观写作详情模态框
        currentWriting: null     // 当前查看的内观写作
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('[用户详情] 页面加载，参数:', options);
        
        if (options.userId) {
            this.setData({
                userId: options.userId,
                userName: options.userName || '禅修者'
            });
            
            // 加载用户数据
            this.loadUserData();
            
            // 加载用户的内观写作内容
            this.loadUserWritings();
        } else {
            wx.showToast({
                title: '用户信息不存在',
                icon: 'error'
            });
            
            // 延迟返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }
    },

    /**
     * 格式化时间为相对时间
     * @param {string} dateString - ISO格式的时间字符串
     * @returns {string} 相对时间描述
     */
    formatRelativeTime(dateString) {
        if (!dateString) return '未知';
        
        const loginTime = new Date(dateString);
        const now = new Date();
        const diffMs = now - loginTime;
        
        // 计算时间差（毫秒）
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        
        // 根据时间差返回对应的描述
        if (diffMinutes < 5) {
            return '刚刚登录过';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}分钟前登录`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前登录`;
        } else if (diffDays < 7) {
            return `${diffDays}天前登录`;
        } else if (diffWeeks < 4) {
            return `${diffWeeks}周前登录`;
        } else {
            return '一个月前登录';
        }
    },

    /**
     * 加载用户数据
     */
    loadUserData() {
        const db = app.globalData.db;
        const userId = this.data.userId;
        
        // 获取用户基本信息 - 从userinfo集合获取
        db.collection('userinfo').where({
            openId: userId
        }).get().then(res => {
            console.log('[用户详情] 获取用户信息成功:', res.data);
            
            // 检查是否有数据
            if (res.data && res.data.length > 0) {
                const userInfo = res.data[0];
                // 计算木鱼和颂钵相关的累计数据
                const muyuCount = userInfo.accumulateMuyu || 0;
                const songboCount = userInfo.accumulateSongbo || 0;
                const muyuSeconds = userInfo.accumulateMuyuTime || 0;
                const songboSeconds = userInfo.accumulateSongboTime || 0;
                const muyuMinutes = Math.ceil(muyuSeconds / 60);
                const songboMinutes = Math.ceil(songboSeconds / 60);
                const totalTapCount = muyuCount + songboCount;
                const totalTrainingMinutes = muyuMinutes + songboMinutes;
                
                // 格式化登录时间为相对时间
                const relativeTime = this.formatRelativeTime(userInfo.lastUpdateTime || userInfo.lastLoginTime);
                
                this.setData({
                    userInfo,
                    muyuCount,
                    songboCount,
                    muyuMinutes,
                    songboMinutes,
                    totalTapCount,
                    totalTrainingMinutes,
                    lastLoginTime: relativeTime,
                    isLoading: false
                });
            } else {
                this.setData({
                    isLoading: false
                });
                console.log('[用户详情] 没有找到用户信息');
            }
        }).catch(err => {
            console.error('[用户详情] 获取用户信息失败:', err);
            this.setData({
                isLoading: false
            });
        });
    },

    /**
     * 加载用户公开的内观写作
     */
    loadUserWritings() {
        const db = app.globalData.db;
        const userId = this.data.userId;
        
        // 从writelog集合获取用户的写作记录，仅获取visible为true的公开记录
        db.collection('writelog').where({
            openId: userId,
            visible: true
        }).orderBy('timestamp', 'desc').limit(10).get().then(res => {
            console.log('[用户详情] 获取用户内观写作成功:', res.data);
            
            // 转换数据格式以便于显示
            const writings = res.data.map(item => {
                // 将时间戳转换为可读的日期
                let createTime = '未知时间';
                if (item.timestamp) {
                    const date = new Date(item.timestamp);
                    createTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                } else if (item.date) {
                    createTime = item.date;
                }
                
                return {
                    title: '内观写作', // writelog可能没有标题字段，使用固定标题
                    content: item.content || '',
                    createTime: createTime,
                    insightCount: item.insightCount || 0,
                    originalData: item // 保留原始数据
                };
            });
            
            // 根据数量决定是否显示展开/收起按钮
            const showToggleBtn = writings.length > 3;
            // 默认只显示前3条
            const displayedWritings = showToggleBtn ? writings.slice(0, 3) : writings;
            
            this.setData({
                writingRecords: writings,
                displayedWritings: displayedWritings,
                showToggleBtn: showToggleBtn,
                isWritingsExpanded: false
            });
        }).catch(err => {
            console.error('[用户详情] 获取用户内观写作失败:', err);
        });
    },

    /**
     * 切换内观写作的展开/收起状态
     */
    toggleWritings() {
        const isExpanded = this.data.isWritingsExpanded;
        const allWritings = this.data.writingRecords;
        
        // 切换展开状态
        if (isExpanded) {
            // 收起，只显示前3条
            this.setData({
                isWritingsExpanded: false,
                displayedWritings: allWritings.slice(0, 3)
            });
        } else {
            // 展开，显示全部
            this.setData({
                isWritingsExpanded: true,
                displayedWritings: allWritings
            });
        }
    },

    /**
     * 返回上一页
     */
    navigateBack() {
        wx.navigateBack();
    },

    /**
     * 查看内观写作详情
     */
    viewWritingDetail(e) {
        const index = e.currentTarget.dataset.index;
        const record = this.data.displayedWritings[index];
        
        if (record) {
            // 添加从originalData中读取like值
            const originalData = record.originalData || {};
            const likes = originalData.like || 0;
            
            // 将likes添加到originalData中以便在模板中访问
            record.originalData.likes = likes;
            
            // 显示模态框并设置当前查看的写作内容
            this.setData({
                showWritingModal: true,
                currentWriting: record
            });
        }
    },
    
    /**
     * 关闭内观写作详情模态框
     */
    closeWritingModal() {
        this.setData({
            showWritingModal: false,
            currentWriting: null
        });
    },
    
    /**
     * 点击模态框背景时关闭模态框
     */
    closeModalOnMask() {
        this.closeWritingModal();
    },
    
    /**
     * 阻止模态框内容区域的点击事件冒泡
     */
    preventBubble() {
        // 阻止事件冒泡
        return;
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        // 重新加载数据
        this.loadUserData();
        this.loadUserWritings();
        
        // 完成后停止下拉刷新
        wx.stopPullDownRefresh();
    }
}) 