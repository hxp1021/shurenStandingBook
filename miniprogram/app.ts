// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.cloud.init({
      env: 'cloud1-2ghygzbwe314480b', // 替换为自己的环境ID
      traceUser: true, // 跟踪用户行为
    });

    // 小程序启动时获取OpenID并缓存
    wx.cloud.callFunction({
      name: 'getOpenid',
      success: (res) => {
        this.globalData.openid = res.result.openid;
        console.log(res, '>>>>>>>>>1111111111')
      },
      fail: (err) => {
        console.error('启动时获取OpenID失败：', err);
      }
    });   

    // 登录
    wx.login({
      success: res => {
        console.log(res.code, '>>>>>>>>')
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
})