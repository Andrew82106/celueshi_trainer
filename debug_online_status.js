// 在线状态调试脚本
// 使用方法：在控制台中运行 require('./debug_online_status.js').startDebug()

const app = getApp();

/**
 * 开始详细调试在线状态
 */
function startDebug() {
    console.log('🔍 ===== 开始在线状态详细调试 =====');
    
    const db = app.globalData.db;
    const currentTime = Date.now();
    const oneMinuteAgo = currentTime - 60000;
    
    console.log(`⏰ 当前时间戳: ${currentTime}`);
    console.log(`⏰ 一分钟前时间戳: ${oneMinuteAgo}`);
    console.log(`⏰ 当前时间: ${new Date(currentTime).toLocaleString()}`);
    console.log(`⏰ 一分钟前时间: ${new Date(oneMinuteAgo).toLocaleString()}`);
    
    // 步骤1：检查数据库连接
    console.log('\n📡 步骤1：检查数据库连接...');
    if (!db) {
        console.error('❌ 数据库连接失败！');
        return;
    }
    console.log('✅ 数据库连接正常');
    
    // 步骤2：获取所有在线状态记录
    console.log('\n📊 步骤2：获取所有在线状态记录...');
    db.collection('userOnlineStatus').get().then(res => {
        console.log(`📋 数据库中总共有 ${res.data.length} 条在线状态记录`);
        
        if (res.data.length === 0) {
            console.log('⚠️ 数据库中没有任何在线状态记录！');
            return;
        }
        
        // 详细分析每条记录
        console.log('\n🔍 详细分析每条记录：');
        res.data.forEach((record, index) => {
            const timeDiff = currentTime - record.lastActiveTime;
            const isWithinOneMinute = timeDiff < 60000;
            const minutesAgo = Math.floor(timeDiff / 60000);
            const secondsAgo = Math.floor((timeDiff % 60000) / 1000);
            
            console.log(`\n📝 记录 ${index + 1}:`);
            console.log(`   👤 用户ID: ${record.openId}`);
            console.log(`   🟢 状态标记: ${record.isOnline ? '在线' : '离线'}`);
            console.log(`   ⏰ 最后活跃时间戳: ${record.lastActiveTime}`);
            console.log(`   📅 最后活跃时间: ${new Date(record.lastActiveTime).toLocaleString()}`);
            console.log(`   ⏱️ 距离现在: ${minutesAgo}分${secondsAgo}秒前`);
            console.log(`   ✅ 是否在1分钟内: ${isWithinOneMinute ? '是' : '否'}`);
            console.log(`   🎯 应该算作在线: ${isWithinOneMinute ? '是' : '否'}`);
        });
        
        // 步骤3：使用不同方法统计在线用户
        console.log('\n📊 步骤3：使用不同方法统计在线用户...');
        
        // 方法1：直接查询（木鱼/颂钵页面使用的方法）
        console.log('\n🔍 方法1：直接查询在线用户数量...');
        db.collection('userOnlineStatus').where({
            lastActiveTime: db.command.gt(oneMinuteAgo)
        }).count().then(countRes => {
            console.log(`📊 方法1结果：${countRes.total} 个在线用户`);
            
            // 方法2：获取具体记录然后过滤
            console.log('\n🔍 方法2：获取具体记录然后过滤...');
            db.collection('userOnlineStatus').where({
                lastActiveTime: db.command.gt(oneMinuteAgo)
            }).get().then(detailRes => {
                console.log(`📊 方法2结果：${detailRes.data.length} 个在线用户`);
                
                console.log('\n📋 在线用户详细信息：');
                detailRes.data.forEach((user, index) => {
                    const timeDiff = currentTime - user.lastActiveTime;
                    console.log(`   ${index + 1}. 用户ID: ${user.openId}, 最后活跃: ${Math.floor(timeDiff/1000)}秒前`);
                });
                
                // 方法3：手动过滤所有记录
                console.log('\n🔍 方法3：手动过滤所有记录...');
                const manualOnlineUsers = res.data.filter(record => {
                    return record.lastActiveTime > oneMinuteAgo;
                });
                console.log(`📊 方法3结果：${manualOnlineUsers.length} 个在线用户`);
                
                // 步骤4：检查重复记录
                console.log('\n🔍 步骤4：检查重复记录...');
                const userGroups = {};
                res.data.forEach(record => {
                    if (!userGroups[record.openId]) {
                        userGroups[record.openId] = [];
                    }
                    userGroups[record.openId].push(record);
                });
                
                const duplicateUsers = [];
                Object.keys(userGroups).forEach(openId => {
                    if (userGroups[openId].length > 1) {
                        duplicateUsers.push({
                            openId: openId,
                            count: userGroups[openId].length,
                            records: userGroups[openId]
                        });
                    }
                });
                
                if (duplicateUsers.length > 0) {
                    console.log(`⚠️ 发现 ${duplicateUsers.length} 个用户有重复记录：`);
                    duplicateUsers.forEach(user => {
                        console.log(`   👤 用户 ${user.openId} 有 ${user.count} 条记录`);
                        user.records.forEach((record, index) => {
                            console.log(`      记录${index + 1}: ${new Date(record.lastActiveTime).toLocaleString()}`);
                        });
                    });
                } else {
                    console.log('✅ 没有发现重复记录');
                }
                
                // 步骤5：检查当前用户状态
                console.log('\n🔍 步骤5：检查当前用户状态...');
                const currentUserOpenId = app.globalData.userInfo && app.globalData.userInfo.openId;
                if (currentUserOpenId) {
                    console.log(`👤 当前用户ID: ${currentUserOpenId}`);
                    const currentUserRecords = userGroups[currentUserOpenId] || [];
                    console.log(`📋 当前用户记录数: ${currentUserRecords.length}`);
                    
                    if (currentUserRecords.length > 0) {
                        currentUserRecords.forEach((record, index) => {
                            const timeDiff = currentTime - record.lastActiveTime;
                            console.log(`   记录${index + 1}: ${Math.floor(timeDiff/1000)}秒前活跃, 状态: ${record.isOnline ? '在线' : '离线'}`);
                        });
                    } else {
                        console.log('⚠️ 当前用户没有在线状态记录！');
                    }
                } else {
                    console.log('⚠️ 无法获取当前用户ID');
                }
                
                // 步骤6：总结分析
                console.log('\n📊 步骤6：总结分析...');
                console.log(`📈 统计结果对比：`);
                console.log(`   方法1（直接查询count）: ${countRes.total}`);
                console.log(`   方法2（查询记录后计数）: ${detailRes.data.length}`);
                console.log(`   方法3（手动过滤）: ${manualOnlineUsers.length}`);
                
                if (countRes.total === detailRes.data.length && detailRes.data.length === manualOnlineUsers.length) {
                    console.log('✅ 所有方法结果一致');
                } else {
                    console.log('❌ 不同方法结果不一致，存在问题！');
                }
                
                console.log(`📋 数据库总记录数: ${res.data.length}`);
                console.log(`👥 唯一用户数: ${Object.keys(userGroups).length}`);
                console.log(`🔄 重复记录用户数: ${duplicateUsers.length}`);
                
                console.log('\n🔍 ===== 在线状态详细调试完成 =====');
            });
        });
    }).catch(err => {
        console.error('❌ 获取在线状态记录失败:', err);
    });
}

/**
 * 测试在线状态更新
 */
function testOnlineStatusUpdate() {
    console.log('🧪 ===== 测试在线状态更新 =====');
    
    const currentUserOpenId = app.globalData.userInfo && app.globalData.userInfo.openId;
    if (!currentUserOpenId) {
        console.log('⚠️ 无法获取当前用户ID，无法测试');
        return;
    }
    
    console.log(`👤 测试用户: ${currentUserOpenId}`);
    
    // 手动更新在线状态
    console.log('📤 手动更新在线状态...');
    app.updateUserOnlineStatus(currentUserOpenId, true);
    
    // 等待2秒后检查结果
    setTimeout(() => {
        console.log('🔍 检查更新结果...');
        const db = app.globalData.db;
        
        db.collection('userOnlineStatus').where({
            openId: currentUserOpenId
        }).get().then(res => {
            console.log(`📋 用户 ${currentUserOpenId} 的记录数: ${res.data.length}`);
            
            if (res.data.length > 0) {
                res.data.forEach((record, index) => {
                    const timeDiff = Date.now() - record.lastActiveTime;
                    console.log(`   记录${index + 1}:`);
                    console.log(`      状态: ${record.isOnline ? '在线' : '离线'}`);
                    console.log(`      最后活跃: ${Math.floor(timeDiff/1000)}秒前`);
                    console.log(`      记录ID: ${record._id}`);
                });
            } else {
                console.log('⚠️ 没有找到用户记录');
            }
            
            // 再次统计在线用户数
            db.collection('userOnlineStatus').where({
                lastActiveTime: db.command.gt(Date.now() - 60000)
            }).count().then(countRes => {
                console.log(`📊 更新后在线用户数: ${countRes.total}`);
            });
        });
    }, 2000);
}

/**
 * 清理重复记录并测试
 */
function cleanupAndTest() {
    console.log('🧹 ===== 清理重复记录并测试 =====');
    
    // 先清理重复记录
    if (app.cleanupDuplicateOnlineStatus) {
        console.log('🧹 开始清理重复记录...');
        app.cleanupDuplicateOnlineStatus();
        
        // 等待清理完成后重新测试
        setTimeout(() => {
            console.log('🔍 清理完成，重新测试...');
            startDebug();
        }, 3000);
    } else {
        console.log('⚠️ 清理函数不存在');
    }
}

/**
 * 实时监控在线状态变化
 */
function startRealTimeMonitor() {
    console.log('📡 ===== 开始实时监控在线状态 =====');
    
    const db = app.globalData.db;
    let lastCount = 0;
    
    const monitor = setInterval(() => {
        db.collection('userOnlineStatus').where({
            lastActiveTime: db.command.gt(Date.now() - 60000)
        }).count().then(res => {
            if (res.total !== lastCount) {
                console.log(`📊 [${new Date().toLocaleTimeString()}] 在线用户数变化: ${lastCount} → ${res.total}`);
                lastCount = res.total;
            }
        });
    }, 5000); // 每5秒检查一次
    
    console.log('📡 实时监控已启动，每5秒检查一次在线用户数变化');
    console.log('⏹️ 要停止监控，请运行: clearInterval(' + monitor + ')');
    
    return monitor;
}

// 导出调试函数
module.exports = {
    startDebug,
    testOnlineStatusUpdate,
    cleanupAndTest,
    startRealTimeMonitor
}; 