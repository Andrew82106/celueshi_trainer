const cloud = require('wx-server-sdk')
cloud.init({
  env: "shanmen-2g47tf5h9b090d06"
})
const db = cloud.database()
const userCollection = db.collection('userInfo')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 从前端传递的参数中获取用户信息
  const { nickName, avatarUrl } = event
  
  try {
    // 查询是否已存在该用户
    const userResult = await userCollection.where({
      openid: openid
    }).get()
    
    if (userResult.data.length > 0) {
      // 用户已存在，更新信息
      await userCollection.doc(userResult.data[0]._id).update({
        data: {
          nickname: nickName,
          avatarUrl: avatarUrl,
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        message: '用户信息更新成功',
        isNewUser: false,
        openid: openid
      }
    } else {
      // 用户不存在，创建新用户
      const result = await userCollection.add({
        data: {
          openid: openid,
          nickname: nickName,
          avatarUrl: avatarUrl,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        message: '用户创建成功',
        isNewUser: true,
        openid: openid,
        userId: result._id
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err,
      openid: openid
    }
  }
} 