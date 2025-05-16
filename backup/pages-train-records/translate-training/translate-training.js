Page({
  data: {
    textFiles: [
      { 
        id: 1, 
        title: '语料A(News)',
        content: [
          "A Devon entrepreneur who appeared on hit BBC show Dragons' Den has secured investment for his coffee company after a successful pitch.",
          "Will Little, who owns family-run Little's Coffee, was looking for £80,000 for 2% of his Cullompton-based business and received four offers from the dragons.",
          " The second-generation business owner finally agreed a deal with investor Steven Bartlett for 5% of his company - for the full amount of money."
        ],
        translate: [
          "一个来自德文郡的企业家在热门的英国广播公司节目《龙之谷》中成功获得了投资，用于他的咖啡公司。",
          "威尔·利特尔，拥有家族经营的利特尔咖啡公司，正在寻找80,000英镑用于2%的他在库尔姆普顿的生意，并从龙那里收到了四份报价。",
          "这位第二代企业主最终与投资者史蒂文·巴特利特达成协议，以5%的股份获得全额资金。"
        ]
      },
      { 
        id: 2, 
        title: '语料B(News)',
        content: [
          "North East technology company Kromek has announced a £30m deal with a global health corporation which it says will be 'transformational' for its fortunes.",
          "The County Durham firm has for a number of years been a high profile leader for the region's technology sector, being named as one of the UK's most innovative firms and attracting a visit from then Prince Charles in 2022.",
          "But it has struggled to turn its technology into a profit, announcing another loss today in interim results for the six months ended 31 October 2024."
        ],
        translate: [
          "东北技术公司Kromek今天宣布与一家全球健康公司达成3000万英镑的交易，称这将对其业务产生'变革性'影响。",
          "这家位于达勒姆的科技公司多年来一直是该地区科技行业的领军企业，被列为英国最具创新性的公司之一，并吸引了2022年时任威尔士亲王查尔斯王子访问。",
          "但它在将技术转化为利润方面一直面临困难，今天宣布在截至2024年10月31日的六个月中期业绩中又出现亏损。"
        ]
      }
    ],
    loading: false,
    translationMode: 'en2zh', // 新增翻译模式状态，默认英译中
    isGuest: false,
  },

  onLoad(options) {
    const app = getApp();
    this.setData({
      isGuest: app.globalData.isGuest || false
    });
  },

  onBack() {
    wx.navigateBack()
  },

  // 新增模式选择处理
  selectTranslationMode(e) {
    const mode = e.currentTarget.dataset.mode;
    console.log('[DEBUG] 选择的翻译模式:', mode);
    this.setData({ translationMode: mode });
  },

  // 修改后的选择训练文本方法
  selectTextFile(e) {
    const { id } = e.currentTarget.dataset;
    const file = this.data.textFiles.find(f => f.id === id);
    console.log('[DEBUG] 原始语料内容:', file.content);
    
    // 根据模式构建数据结构
    const structuredContent = file.content.map((text, index) => {
      const isEn2Zh = this.data.translationMode === 'en2zh';
      return {
        source: isEn2Zh ? text : file.translate[index],
        reference: isEn2Zh ? file.translate[index] : text
      };
    });
    
    console.log('[DEBUG] 结构化后的内容:', structuredContent);
    
    wx.navigateTo({
      url: `/packageTrain/pages/translate-drill/translate-drill?content=${encodeURIComponent(JSON.stringify(structuredContent))}&title=${encodeURIComponent(file.title)}&mode=${this.data.translationMode}`
    });
  },

  saveRecord: function(result) {
    const record = {
      date: new Date().toISOString(),
      word: this.data.currentWord,
      userTranslation: this.data.userInput,
      correct: result.correct,
      correctTranslation: result.correctTranslation
    };
    
    // 更新当前会话中显示的记录（游客模式也可以查看本次会话的记录）
    this.setData({
      records: [record, ...this.data.records]
    });
    
    // 只有非游客模式才永久存储数据
    if (!this.data.isGuest && getApp().globalData.userInfo) {
      // 获取之前的记录
      const records = wx.getStorageSync('translateRecords') || {};
      const userId = getApp().globalData.userInfo.openid || getApp().globalData.userInfo.nickName;
      records[userId] = records[userId] || [];
      records[userId].push(record);
      
      // 保存记录
      wx.setStorageSync('translateRecords', records);
    }
  }
}); 