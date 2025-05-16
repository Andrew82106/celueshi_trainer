/**
 * 播放颂钵敲击音效
 */
Page({
  data: {
    isMuted: false
  },

  onLoad() {
    console.log('颂钵页面加载 onLoad');
  },
  
  onReady() {
    console.log('颂钵页面准备完成 onReady');
  },
  
  onShow() {
    console.log('颂钵页面显示 onShow');
  },
  
  // 颂钵被点击时的处理函数
  tapSongbo() {
    console.log('======= 颂钵敲击函数 tapSongbo 开始执行 =======');
    console.log('颂钵被点击，准备播放音效');
    this.playSound();
    console.log('======= 颂钵敲击函数执行结束 =======');
  },

  // 颂钵被点击时的处理函数 - 兼容性别名
  handleTap() {
    console.log('颂钵被点击 handleTap - 转发至 tapSongbo');
    this.tapSongbo();
  },

  playSound() {
    // 最早的调试信息，在任何条件判断前
    console.log('======= 颂钵音频函数开始执行 =======');
    
    // 如果静音，则不播放音效
    if (this.data.isMuted) {
        console.log('颂钵音效未播放：静音模式已开启');
        return;
    }
    
    console.log('尝试创建颂钵音频上下文...');
    
    try {
        // 现在创建音频上下文并播放
        const innerAudioContext = wx.createInnerAudioContext({useWebAudioImplement: false});
        console.log('颂钵音频上下文创建成功');
        
        // 设置音频路径
        const audioPath = '/packageZenAssets/assets/audio/songbo.wav';
        console.log('设置颂钵音频路径:', audioPath);
        innerAudioContext.src = audioPath;
        
        // 设置自动播放
        console.log('设置自动播放');
        innerAudioContext.autoplay = true;
        
        // 添加事件监听器
        innerAudioContext.onCanplay(() => {
            console.log('颂钵音频已准备好播放 onCanplay');
        });
        
        innerAudioContext.onPlay(() => {
            console.log('颂钵音频开始播放 onPlay');
        });
        
        innerAudioContext.onError((err) => {
            console.error('颂钵音频播放错误:', err.errMsg);
            console.error('颂钵音频错误码:', err.errCode);
            
            // 尝试备用方案
            console.log('尝试备用路径播放颂钵音频');
            try {
                const backupAudio = wx.createInnerAudioContext({useWebAudioImplement: false});
                backupAudio.src = '/packageZenAssets/packageZenAssets/assets/audio/songbo.wav';
                backupAudio.autoplay = true;
                
                backupAudio.onPlay(() => {
                    console.log('颂钵备用音频开始播放');
                });
                
                backupAudio.onError((backupErr) => {
                    console.error('颂钵备用音频播放失败:', backupErr.errMsg);
                });
            } catch (backupError) {
                console.error('创建备用音频失败:', backupError);
            }
        });
        
        // 尝试播放
        console.log('尝试播放颂钵音频...');
        innerAudioContext.play();
        console.log('颂钵音频 play() 方法调用完成');
        
    } catch (e) {
        console.error('颂钵音频处理出现异常:', e);
    }
    
    console.log('======= 颂钵音频函数执行结束 =======');
  }
}); 