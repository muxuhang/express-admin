/**
 * 路径规范化工具
 * 用于将包含MongoDB ObjectId、用户ID和数字ID的API路径规范化为参数化路径
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
   * 检查路径是否包含用户ID模式
   */
  static hasUserId(path) {
    // 匹配用户ID模式：user_数字_数字_数字_字符串
    const userIdPattern = /user_\d+_\d+_\d+_[a-zA-Z0-9]+/
    return userIdPattern.test(path)
  }

  /**
   * 检查路径是否包含数字ID模式
   */
  static hasNumericId(path) {
    // 匹配纯数字ID模式：至少10位数字
    const numericIdPattern = /\/(\d{10,})\/?$/
    return numericIdPattern.test(path)
  }

  /**
   * 检查路径是否包含会话ID模式
   */
  static hasSessionId(path) {
    // 匹配会话ID模式：数字或用户ID格式
    const sessionIdPattern = /\/(\d{10,}|user_\d+_\d+_\d+_[a-zA-Z0-9]+)\/?$/
    return sessionIdPattern.test(path) && path.includes('/api/chat/session/')
  }

  /**
   * 将路径中的ObjectId、用户ID和数字ID替换为参数化路径
   */
  static normalizePath(path) {
    let normalizedPath = path

    // 首先处理会话ID模式（针对聊天会话路径）
    if (this.hasSessionId(path)) {
      normalizedPath = normalizedPath.replace(/\/(\d{10,}|user_\d+_\d+_\d+_[a-zA-Z0-9]+)\/?$/, '/:id')
    }

    // 然后处理用户ID模式
    if (this.hasUserId(normalizedPath)) {
      normalizedPath = normalizedPath.replace(/user_\d+_\d+_\d+_[a-zA-Z0-9]+/g, ':id')
    }

    // 再处理数字ID模式
    if (this.hasNumericId(normalizedPath)) {
      normalizedPath = normalizedPath.replace(/\/(\d{10,})\/?$/g, '/:id')
    }

    // 最后处理MongoDB ObjectId
    if (this.hasObjectId(normalizedPath)) {
      normalizedPath = normalizedPath.replace(/[0-9a-fA-F]{24}/g, ':id')
    }

    return normalizedPath
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
              // 检查路径是否包含会话ID
              hasSessionId: {
                $regexMatch: {
                  input: '$path',
                  regex: '\\/(\\d{10,}|user_\\d+_\\d+_\\d+_[a-zA-Z0-9]+)\\/?$',
                },
              },
              isChatSession: {
                $regexMatch: {
                  input: '$path',
                  regex: '\\/api\\/chat\\/session\\/',
                },
              },
              // 检查路径是否包含用户ID
              hasUserId: {
                $regexMatch: {
                  input: '$path',
                  regex: 'user_\\d+_\\d+_\\d+_[a-zA-Z0-9]+',
                },
              },
              // 检查路径是否包含数字ID
              hasNumericId: {
                $regexMatch: {
                  input: '$path',
                  regex: '\\/(\\d{10,})\\/?$',
                },
              },
              // 检查路径是否包含ObjectId
              hasObjectId: {
                $regexMatch: {
                  input: '$path',
                  regex: '[0-9a-fA-F]{24}',
                },
              },
            },
            in: {
              $let: {
                vars: {
                  // 先处理会话ID
                  pathAfterSessionId: {
                    $cond: {
                      if: { $and: ['$$hasSessionId', '$$isChatSession'] },
                      then: {
                        $let: {
                          vars: {
                            sessionIdMatch: {
                              $regexFind: {
                                input: '$path',
                                regex: '\\/(\\d{10,}|user_\\d+_\\d+_\\d+_[a-zA-Z0-9]+)\\/?$',
                              },
                            },
                          },
                          in: {
                            $cond: {
                              if: { $ne: ['$$sessionIdMatch', null] },
                              then: {
                                $concat: [{ $substr: ['$path', 0, '$$sessionIdMatch.idx'] }, '/:id'],
                              },
                              else: '$path',
                            },
                          },
                        },
                      },
                      else: '$path',
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      // 再处理用户ID
                      pathAfterUserId: {
                        $cond: {
                          if: {
                            $regexMatch: {
                              input: '$$pathAfterSessionId',
                              regex: 'user_\\d+_\\d+_\\d+_[a-zA-Z0-9]+',
                            },
                          },
                          then: {
                            $let: {
                              vars: {
                                userIdMatch: {
                                  $regexFind: {
                                    input: '$$pathAfterSessionId',
                                    regex: 'user_\\d+_\\d+_\\d+_[a-zA-Z0-9]+',
                                  },
                                },
                              },
                              in: {
                                $cond: {
                                  if: { $ne: ['$$userIdMatch', null] },
                                  then: {
                                    $concat: [
                                      { $substr: ['$$pathAfterSessionId', 0, '$$userIdMatch.idx'] },
                                      ':id',
                                      {
                                        $substr: [
                                          '$$pathAfterSessionId',
                                          { $add: ['$$userIdMatch.idx', { $strLenCP: '$$userIdMatch.match' }] },
                                          { $strLenCP: '$$pathAfterSessionId' },
                                        ],
                                      },
                                    ],
                                  },
                                  else: '$$pathAfterSessionId',
                                },
                              },
                            },
                          },
                          else: '$$pathAfterSessionId',
                        },
                      },
                    },
                    in: {
                      $let: {
                        vars: {
                          // 再处理数字ID
                          pathAfterNumericId: {
                            $cond: {
                              if: {
                                $regexMatch: {
                                  input: '$$pathAfterUserId',
                                  regex: '\\/(\\d{10,})\\/?$',
                                },
                              },
                              then: {
                                $let: {
                                  vars: {
                                    numericIdMatch: {
                                      $regexFind: {
                                        input: '$$pathAfterUserId',
                                        regex: '\\/(\\d{10,})\\/?$',
                                      },
                                    },
                                  },
                                  in: {
                                    $cond: {
                                      if: { $ne: ['$$numericIdMatch', null] },
                                      then: {
                                        $concat: [
                                          { $substr: ['$$pathAfterUserId', 0, '$$numericIdMatch.idx'] },
                                          '/:id',
                                        ],
                                      },
                                      else: '$$pathAfterUserId',
                                    },
                                  },
                                },
                              },
                              else: '$$pathAfterUserId',
                            },
                          },
                        },
                        in: {
                          // 最后处理ObjectId
                          $cond: {
                            if: {
                              $regexMatch: {
                                input: '$$pathAfterNumericId',
                                regex: '[0-9a-fA-F]{24}',
                              },
                            },
                            then: {
                              $let: {
                                vars: {
                                  objectIdMatch: {
                                    $regexFind: {
                                      input: '$$pathAfterNumericId',
                                      regex: '[0-9a-fA-F]{24}',
                                    },
                                  },
                                },
                                in: {
                                  $cond: {
                                    if: { $ne: ['$$objectIdMatch', null] },
                                    then: {
                                      $concat: [
                                        { $substr: ['$$pathAfterNumericId', 0, '$$objectIdMatch.idx'] },
                                        ':id',
                                        {
                                          $substr: [
                                            '$$pathAfterNumericId',
                                            { $add: ['$$objectIdMatch.idx', 24] },
                                            { $strLenCP: '$$pathAfterNumericId' },
                                          ],
                                        },
                                      ],
                                    },
                                    else: '$$pathAfterNumericId',
                                  },
                                },
                              },
                            },
                            else: '$$pathAfterNumericId',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
  }

  /**
   * 测试路径规范化功能
   */
  static testNormalization() {
    const testPaths = [
      // 聊天会话相关路径
      '/api/chat/session/1753752506776',
      '/api/chat/session/user_1753752506770_917_1753756097491_awcrdhmpo',
      '/api/chat/session/1234567890123',

      // 用户ID相关路径
      '/api/chat/session/user_1234567890_123_1234567890_abcdef',
      '/api/users/profile/user_9876543210_456_9876543210_xyz123',
      '/api/chat/history/user_1111111111_222_3333333333_test123',
      '/api/chat/messages/user_9999999999_888_7777777777_sample456',

      // 数字ID相关路径
      '/api/users/1234567890123',
      '/api/articles/9876543210987',
      '/api/roles/5555555555555/menus',

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
      '/api/chat/send',
      '/api/users/list',
      '/api/chat/session/active',
    ]

    console.log('🧪 测试路径规范化功能...\n')
    console.log('📋 测试结果:')

    testPaths.forEach((path, index) => {
      const normalized = this.normalizePath(path)
      const hasSessionId = this.hasSessionId(path)
      const hasUserId = this.hasUserId(path)
      const hasNumericId = this.hasNumericId(path)
      const hasObjectId = this.hasObjectId(path)
      const shouldNormalize = hasSessionId || hasUserId || hasNumericId || hasObjectId
      const status = shouldNormalize ? '✅' : '❌'
      let type = '普通路径'
      if (hasSessionId) type = '会话ID'
      else if (hasUserId) type = '用户ID'
      else if (hasNumericId) type = '数字ID'
      else if (hasObjectId) type = 'ObjectId'
      console.log(`${index + 1}. ${status} [${type}] ${path} → ${normalized}`)
    })

    console.log('\n✅ 路径规范化功能正常工作！')
  }
}

export default PathNormalizer
