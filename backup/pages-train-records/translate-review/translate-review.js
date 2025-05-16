// pages/translate-review/translate-review.js
const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        content: [],
        userTranslations: [],
        showEvaluation: false,
        evaluationResult: null,
        mode: 'en2zh'
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        //debug
        console.log('[DEBUG] onLoad传递的模式参数:', options.translationMode);
        console.log('[DEBUG] onLoad传递的模式参数jsonify:', JSON.parse(decodeURIComponent(options.translationMode)));
        const content = JSON.parse(decodeURIComponent(options.content));
        const userTranslations = JSON.parse(decodeURIComponent(options.translations));
        const modeFromUp = JSON.parse(decodeURIComponent(options.translationMode));
        this.setData({
            content,
            userTranslations,
            mode: modeFromUp || 'en2zh'
        });
        console.log('[DEBUG] 页面参数:', options);
        console.log('[DEBUG] 原始content参数:', options.content);
        console.log('[DEBUG] 接收到的模式参数:', this.data.mode);
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    },

    navigateBackToEdit() {
        wx.navigateBack();
    },

    async startEvaluation() {
        try {
            wx.showLoading({ title: '评测中...', mask: true })
            
            // 构造评测请求数据
            const evaluationRequests = this.data.content.map((item, index) => {
                const userTranslation = this.data.userTranslations[index]
                return this.createEvaluationRequest(item, userTranslation)
            })

            // 并发调用API
            const results = await Promise.all(evaluationRequests)
            
            // 处理评测结果
            const evaluationResult = {
                accuracy: this.calculateOverallScore(results),
                details: results.map((res, index) => {
                    const detail = {
                        source: this.data.content[index].source,
                        reference: this.data.content[index].reference,
                        userTranslation: this.data.userTranslations[index],
                        score: res.score,
                        suggestions: res.suggestions
                    };
                    return detail;
                })
            };

            // 新增保存训练记录
            this.saveTrainingRecord(evaluationResult);
            
            wx.navigateTo({
                url: `/packageRecords/pages/translate-train-records/translate-train-records?result=${encodeURIComponent(JSON.stringify(evaluationResult))}`
            });
        } catch (error) {
            console.error('评测失败:', error)
            wx.showToast({ title: '评测失败，请重试', icon: 'none' })
        } finally {
            wx.hideLoading()
        }
    },

    createEvaluationRequest(item, userTranslation) {
        const prompt = `请根据以下内容，对用户的译文进行翻译评分：
【原文】${item.source}
【参考译文】${item.reference}
【用户译文】${userTranslation}

请返回JSON格式结果包含：
1. score: 0-10分的精确分数（保留1位小数）
2. suggestions: 改进建议（3条，中文）`;

        return new Promise((resolve, reject) => {
            wx.request({
                url: app.globalData.glmBaseUrl,
                method: 'POST',
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${app.globalData.glmApiKey}`
                },
                data: {
                    model: "glm-4-flash",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                },
                success: (res) => {
                    console.log('[DEBUG] API完整响应:', res);
                    
                    if (res.statusCode !== 200) {
                        return reject(`API请求失败，状态码：${res.statusCode}`);
                    }

                    try {
                        // 解析嵌套的JSON结构
                        const apiResponse = res.data;
                        const messageContent = apiResponse.choices[0].message.content;
                        const result = JSON.parse(messageContent);

                        // 验证数据结构
                        if (typeof result.score === 'undefined' || !Array.isArray(result.suggestions)) {
                            throw new Error('返回数据结构异常');
                        }

                        resolve({
                            score: parseFloat(result.score),
                            suggestions: result.suggestions.slice(0, 3)
                        });
                        console.log('[DEBUG] 评测结果:', result);
                        console.log('[DEBUG] 评测score:', result.score);
                        console.log('[DEBUG] 评测context:', result.suggestions);
                    } catch (e) {
                        console.error('解析错误:', e);
                        reject('解析响应失败：' + e.message);
                    }
                },
                fail: (err) => {
                    console.error('请求失败:', err);
                    reject('网络请求失败');
                }
            })
        })
    },

    calculateOverallScore(results) {
        if (!results || !Array.isArray(results)) {
            console.error('无效的评测结果:', results)
            return 0.0
        }
        
        const validResults = results.filter(r => typeof r?.score === 'number')
        if (validResults.length === 0) return 0.0

        const total = validResults.reduce((sum, r) => sum + r.score, 0)
        return (total / validResults.length).toFixed(2)
    },

    // 新增保存记录方法
    saveTrainingRecord(evaluationResult) {
        const newRecord = {
            mode: this.data.mode,
            timestamp: new Date().toISOString(),
            accuracy: evaluationResult.accuracy,
            details: evaluationResult.details.map(d => ({
                source: d.source,
                reference: d.reference,
                userTranslation: d.userTranslation,
                score: d.score,
                suggestions: d.suggestions
            }))
        };
        
        try {
            const records = wx.getStorageSync('translateRecords') || [];
            records.unshift(newRecord); // 最新记录放前面
            wx.setStorageSync('translateRecords', records.slice(0, 100)); // 最多保存100条
            console.log('[DEBUG] 训练记录已保存:', newRecord);
        } catch (e) {
            console.error('存储训练记录失败:', e);
        }
    },
    onBack() {
        wx.navigateBack();
    }
})