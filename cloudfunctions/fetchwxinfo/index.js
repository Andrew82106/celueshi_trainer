// FILEPATH: cloudfunctions/login/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  console.log('in fetchwxinfo:云函数接收到的上下文：', wxContext)
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID
  }
}