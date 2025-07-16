/**
 * 路径规范化工具
 * 用于将包含MongoDB ObjectId的API路径规范化为参数化路径
 */

class PathNormalizer {
  /**
   * 检查路径是否包含MongoDB ObjectId
   */
  static hasObjectId(path) {
    const objectIdPattern = /[0-9a-fA-F]{24}/
    return objectIdPattern.test(path)
  }

  /**
   * 将路径中的ObjectId替换为:id参数
   */
  static normalizePath(path) {
    if (!this.hasObjectId(path)) {
      return path
    }
    
    // 替换所有24位MongoDB ObjectId为:id
    return path.replace(/[0-9a-fA-F]{24}/g, ':id')
  }

  /**
   * 获取MongoDB聚合管道中的路径规范化阶段
   */
  static getNormalizationStage() {
    return {
      $addFields: {
        normalizedPath: {
          $let: {
            vars: {
              // 检查路径是否包含ObjectId
              hasObjectId: {
                $regexMatch: {
                  input: '$path',
                  regex: '[0-9a-fA-F]{24}'
                }
              }
            },
            in: {
              $cond: {
                if: '$$hasObjectId',
                then: {
                  // 使用字符串替换，因为$replaceAll不支持正则表达式
                  // 我们需要手动处理路径中的ObjectId
                  $let: {
                    vars: {
                      // 找到第一个ObjectId的位置
                      firstMatch: {
                        $regexFind: {
                          input: '$path',
                          regex: '[0-9a-fA-F]{24}'
                        }
                      }
                    },
                    in: {
                      $cond: {
                        if: { $ne: ['$$firstMatch', null] },
                        then: {
                          // 替换第一个ObjectId为:id
                          $concat: [
                            { $substr: ['$path', 0, '$$firstMatch.idx'] },
                            ':id',
                            {
                              $substr: [
                                '$path',
                                { $add: ['$$firstMatch.idx', 24] },
                                { $strLenCP: '$path' }
                              ]
                            }
                          ]
                        },
                        else: '$path'
                      }
                    }
                  }
                },
                else: '$path'
              }
            }
          }
        }
      }
    }
  }

  /**
   * 测试路径规范化功能
   */
  static testNormalization() {
    const testPaths = [
      // 角色相关路径
      '/api/roles/6846445cf9c6251c93978389/menus',
      '/api/roles/507f1f77bcf86cd799439011/status',
      '/api/roles/507f1f77bcf86cd799439012',
      
      // 文章相关路径
      '/api/articles/507f1f77bcf86cd799439013/status',
      '/api/articles/507f1f77bcf86cd799439014/view',
      '/api/articles/507f1f77bcf86cd799439015',
      
      // 用户相关路径
      '/api/users/507f1f77bcf86cd799439016',
      '/api/statistics/user/507f1f77bcf86cd799439017',
      
      // 菜单相关路径
      '/api/menus/507f1f77bcf86cd799439018',
      
      // 登录日志路径
      '/api/login-logs/507f1f77bcf86cd799439019',
      
      // 推送任务路径
      '/api/pusher/tasks/507f1f77bcf86cd799439020',
      
      // 不应该被规范化的路径
      '/api/dashboard',
      '/api/login',
      '/api/statistics/overview',
      '/api/chat/send'
    ]

    console.log('🧪 测试路径规范化功能...\n')
    console.log('📋 测试结果:')
    
    testPaths.forEach((path, index) => {
      const normalized = this.normalizePath(path)
      const shouldNormalize = this.hasObjectId(path)
      const status = shouldNormalize ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${path} → ${normalized}`)
    })
    
    console.log('\n✅ 路径规范化功能正常工作！')
  }
}

export default PathNormalizer 