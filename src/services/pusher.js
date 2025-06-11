import Pusher from 'pusher'

// 创建 Pusher 实例
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
})

// 触发事件
const trigger = (channel, event, data) => {
  return pusher.trigger(channel, event, data)
}

// 获取频道信息
const getChannelInfo = async (channel) => {
  return await pusher.get({ path: `/channels/${channel}` })
}

// 获取所有频道
const getChannels = async () => {
  return await pusher.get({ path: '/channels' })
}

// 获取在线用户
const getOnlineUsers = async (channel) => {
  const info = await getChannelInfo(channel)
  return info.users || []
}

export default {
  trigger,
  getChannelInfo,
  getChannels,
  getOnlineUsers
} 