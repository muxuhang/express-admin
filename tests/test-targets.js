// 测试推送目标选项接口
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3000'
const token = 'your-jwt-token-here' // 请替换为实际的 token

async function testPushTargets() {
  try {
    console.log('🔍 测试获取推送目标选项...')
    
    const response = await fetch(`${BASE_URL}/api/pusher/targets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ 获取推送目标选项成功')
      console.log('📊 响应数据:', JSON.stringify(data, null, 2))
      
      if (data.data.users && data.data.users.length > 0) {
        console.log(`👥 找到 ${data.data.users.length} 个活跃用户`)
        data.data.users.forEach(user => {
          console.log(`  - ${user.username} (${user.email}) - 角色: ${user.role}`)
        })
      }
      
      if (data.data.roles && data.data.roles.length > 0) {
        console.log(`🎭 找到 ${data.data.roles.length} 个活跃角色`)
        data.data.roles.forEach(role => {
          console.log(`  - ${role.name} (${role.code}) - ${role.description}`)
        })
      }
    } else {
      console.log('❌ 获取推送目标选项失败')
      console.log('错误信息:', data.message)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

// 测试创建指定用户的推送
async function testSpecificUserPush() {
  try {
    console.log('\n🔍 测试指定用户推送...')
    
    // 首先获取用户列表
    const targetsResponse = await fetch(`${BASE_URL}/api/pusher/targets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const targetsData = await targetsResponse.json()
    
    if (!targetsResponse.ok || !targetsData.data.users.length) {
      console.log('❌ 无法获取用户列表或用户列表为空')
      return
    }
    
    const firstUser = targetsData.data.users[0]
    
    const pushData = {
      title: '指定用户推送测试',
      content: '这是一条专门发送给指定用户的测试消息',
      description: '测试指定用户推送功能',
      type: 'message',
      pushMode: 'immediate',
      targetType: 'specific',
      targetUserIds: [firstUser._id]
    }
    
    const response = await fetch(`${BASE_URL}/api/pusher/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pushData)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ 指定用户推送成功')
      console.log('📊 推送结果:', JSON.stringify(data, null, 2))
    } else {
      console.log('❌ 指定用户推送失败')
      console.log('错误信息:', data.message)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

// 测试创建指定角色的推送
async function testSpecificRolePush() {
  try {
    console.log('\n🔍 测试指定角色推送...')
    
    // 首先获取角色列表
    const targetsResponse = await fetch(`${BASE_URL}/api/pusher/targets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const targetsData = await targetsResponse.json()
    
    if (!targetsResponse.ok || !targetsData.data.roles.length) {
      console.log('❌ 无法获取角色列表或角色列表为空')
      return
    }
    
    const firstRole = targetsData.data.roles[0]
    
    const pushData = {
      title: '指定角色推送测试',
      content: '这是一条专门发送给指定角色的测试消息',
      description: '测试指定角色推送功能',
      type: 'notification',
      pushMode: 'immediate',
      targetType: 'role',
      targetRoleIds: [firstRole.code]
    }
    
    const response = await fetch(`${BASE_URL}/api/pusher/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pushData)
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ 指定角色推送成功')
      console.log('📊 推送结果:', JSON.stringify(data, null, 2))
    } else {
      console.log('❌ 指定角色推送失败')
      console.log('错误信息:', data.message)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始测试推送目标选项功能...\n')
  
  await testPushTargets()
  await testSpecificUserPush()
  await testSpecificRolePush()
  
  console.log('\n✨ 测试完成!')
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error)
}

export { testPushTargets, testSpecificUserPush, testSpecificRolePush } 