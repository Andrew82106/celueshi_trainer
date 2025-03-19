const cloud = require('wx-server-sdk')
cloud.init({
  env: "shanmen-2g47tf5h9b090d06"
})
const db = cloud.database()
const userCollection = db.collection('userInfo')

exports.main = async (event, context) => {
    console.log("in getuserinfo function")
  const openid = event.openid
  console.log("in getUserInfo debug: 获取到openid:", openid)

  try {
    // 根据openid查询用户信息
    const userInfo = await userCollection.where({
      openid: openid
    }).get()

    // 返回查询结果
    return {
      success: true,
      userInfo: userInfo.data.length > 0 ? userInfo.data[0] : null,
      openid: openid
    }
  } catch (err) {
    console.log("in getuserinfo function error:", err)
    return {
      success: false,
      error: err,
      errorMessage: err.message || "未知错误", // 添加错误消息
      openid: openid
    }
  }
} 