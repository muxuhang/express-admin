import fs from 'fs'
import path from 'path'

// API文档配置
const apiDocs = {
  "openapi": "3.0.0",
  "info": {
    "title": "Express Admin API",
    "version": "1.0.0",
    "description": "Express Admin 系统API文档，提供完整的用户管理、角色权限、内容管理等功能"
  },
  "servers": [
    {
      "url": "http://localhost:3000",
      "description": "开发环境"
    }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "paths": {
    "/api/login": {
      "post": {
        "tags": ["认证"],
        "summary": "用户登录",
        "description": "用户通过用户名/手机号和密码进行登录",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["username", "password"],
                "properties": {
                  "username": {
                    "type": "string",
                    "description": "用户名或手机号"
                  },
                  "password": {
                    "type": "string",
                    "description": "密码"
                  }
                }
              },
              "example": {
                "username": "admin",
                "password": "123456"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "登录成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "integer",
                      "example": 0
                    },
                    "message": {
                      "type": "string",
                      "example": "登录成功"
                    },
                    "data": {
                      "type": "object",
                      "properties": {
                        "token": {
                          "type": "string",
                          "description": "JWT令牌"
                        },
                        "user": {
                          "type": "object",
                          "properties": {
                            "id": {"type": "string"},
                            "username": {"type": "string"},
                            "email": {"type": "string"},
                            "phone": {"type": "string"},
                            "role": {"type": "string"},
                            "status": {"type": "string"},
                            "lastLoginAt": {"type": "string", "format": "date-time"}
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "登录失败",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/register": {
      "post": {
        "tags": ["认证"],
        "summary": "用户注册",
        "description": "新用户注册",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["username", "password", "email"],
                "properties": {
                  "username": {"type": "string", "description": "用户名"},
                  "password": {"type": "string", "description": "密码"},
                  "email": {"type": "string", "description": "邮箱"},
                  "phone": {"type": "string", "description": "手机号（可选）"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "注册成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/users": {
      "get": {
        "tags": ["用户管理"],
        "summary": "获取用户列表",
        "description": "获取用户列表，支持分页和搜索",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "keyword",
            "in": "query",
            "description": "搜索关键词（用户名、邮箱、手机号）",
            "schema": {"type": "string"}
          },
          {
            "name": "status",
            "in": "query",
            "description": "用户状态",
            "schema": {
              "type": "string",
              "enum": ["active", "inactive"]
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "页码",
            "schema": {"type": "integer", "default": 1}
          },
          {
            "name": "limit",
            "in": "query",
            "description": "每页数量",
            "schema": {"type": "integer", "default": 10}
          }
        ],
        "responses": {
          "200": {
            "description": "获取成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {
                      "type": "object",
                      "properties": {
                        "total": {"type": "integer"},
                        "page": {"type": "integer"},
                        "limit": {"type": "integer"},
                        "list": {
                          "type": "array",
                          "items": {"type": "object"}
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["用户管理"],
        "summary": "创建新用户",
        "description": "创建新用户",
        "security": [{"bearerAuth": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["username", "password", "email"],
                "properties": {
                  "username": {"type": "string", "description": "用户名"},
                  "password": {"type": "string", "description": "密码"},
                  "email": {"type": "string", "description": "邮箱"},
                  "phone": {"type": "string", "description": "手机号（可选）"},
                  "role": {"type": "string", "description": "用户角色"},
                  "status": {
                    "type": "string",
                    "enum": ["active", "inactive"],
                    "default": "active"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "创建成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {"type": "object"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/users/{id}": {
      "get": {
        "tags": ["用户管理"],
        "summary": "获取用户详情",
        "description": "根据用户ID获取用户详细信息",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "用户ID",
            "schema": {"type": "string"}
          }
        ],
        "responses": {
          "200": {
            "description": "获取成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {"type": "object"}
                  }
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": ["用户管理"],
        "summary": "更新用户信息",
        "description": "更新用户信息",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "用户ID",
            "schema": {"type": "string"}
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "username": {"type": "string"},
                  "email": {"type": "string"},
                  "phone": {"type": "string"},
                  "role": {"type": "string"},
                  "status": {
                    "type": "string",
                    "enum": ["active", "inactive"]
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "更新成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {"type": "object"}
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": ["用户管理"],
        "summary": "删除用户",
        "description": "删除指定用户",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "用户ID",
            "schema": {"type": "string"}
          }
        ],
        "responses": {
          "200": {
            "description": "删除成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/roles": {
      "get": {
        "tags": ["角色管理"],
        "summary": "获取角色列表",
        "description": "获取角色列表，支持分页和搜索",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "keyword",
            "in": "query",
            "description": "搜索关键词（角色名称、编码）",
            "schema": {"type": "string"}
          },
          {
            "name": "status",
            "in": "query",
            "description": "角色状态",
            "schema": {
              "type": "string",
              "enum": ["active", "inactive"]
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "页码",
            "schema": {"type": "integer", "default": 1}
          },
          {
            "name": "limit",
            "in": "query",
            "description": "每页数量",
            "schema": {"type": "integer", "default": 10}
          }
        ],
        "responses": {
          "200": {
            "description": "获取成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {
                      "type": "object",
                      "properties": {
                        "total": {"type": "integer"},
                        "page": {"type": "integer"},
                        "limit": {"type": "integer"},
                        "list": {
                          "type": "array",
                          "items": {"type": "object"}
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["角色管理"],
        "summary": "创建新角色",
        "description": "创建新角色",
        "security": [{"bearerAuth": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name", "code"],
                "properties": {
                  "name": {"type": "string", "description": "角色名称"},
                  "code": {"type": "string", "description": "角色编码"},
                  "description": {"type": "string", "description": "角色描述"},
                  "permissions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "权限列表"
                  },
                  "status": {
                    "type": "string",
                    "enum": ["active", "inactive"],
                    "default": "active"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "创建成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {"type": "object"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/articles": {
      "get": {
        "tags": ["文章管理"],
        "summary": "获取文章列表",
        "description": "获取文章列表，支持分页和搜索",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "keyword",
            "in": "query",
            "description": "搜索关键词（标题、内容、摘要）",
            "schema": {"type": "string"}
          },
          {
            "name": "status",
            "in": "query",
            "description": "文章状态",
            "schema": {
              "type": "string",
              "enum": ["draft", "published", "offline", "pending"]
            }
          },
          {
            "name": "category",
            "in": "query",
            "description": "文章分类",
            "schema": {
              "type": "string",
              "enum": ["article", "news", "announcement", "tutorial"]
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "页码",
            "schema": {"type": "integer", "default": 1}
          },
          {
            "name": "limit",
            "in": "query",
            "description": "每页数量",
            "schema": {"type": "integer", "default": 10}
          }
        ],
        "responses": {
          "200": {
            "description": "获取成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {
                      "type": "object",
                      "properties": {
                        "total": {"type": "integer"},
                        "page": {"type": "integer"},
                        "limit": {"type": "integer"},
                        "list": {
                          "type": "array",
                          "items": {"type": "object"}
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["文章管理"],
        "summary": "创建新文章",
        "description": "创建新文章",
        "security": [{"bearerAuth": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["title", "content"],
                "properties": {
                  "title": {"type": "string", "description": "文章标题"},
                  "content": {"type": "string", "description": "文章内容"},
                  "summary": {"type": "string", "description": "文章摘要"},
                  "category": {
                    "type": "string",
                    "enum": ["article", "news", "announcement", "tutorial"],
                    "default": "article"
                  },
                  "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "文章标签"
                  },
                  "status": {
                    "type": "string",
                    "enum": ["draft", "published", "offline", "pending"],
                    "default": "draft"
                  },
                  "featured": {
                    "type": "boolean",
                    "default": false
                  },
                  "coverImage": {
                    "type": "string",
                    "description": "封面图片URL"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "创建成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {"type": "object"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/articles/{id}": {
      "get": {
        "tags": ["文章管理"],
        "summary": "获取文章详情",
        "description": "根据文章ID获取文章详细信息",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "文章ID",
            "schema": {"type": "string"}
          }
        ],
        "responses": {
          "200": {
            "description": "获取成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {"type": "object"}
                  }
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": ["文章管理"],
        "summary": "更新文章",
        "description": "更新文章信息",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "文章ID",
            "schema": {"type": "string"}
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["title", "content"],
                "properties": {
                  "title": {"type": "string", "description": "文章标题"},
                  "content": {"type": "string", "description": "文章内容"},
                  "summary": {"type": "string", "description": "文章摘要"},
                  "category": {
                    "type": "string",
                    "enum": ["article", "news", "announcement", "tutorial"]
                  },
                  "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "文章标签"
                  },
                  "status": {
                    "type": "string",
                    "enum": ["draft", "published", "offline", "pending"]
                  },
                  "featured": {"type": "boolean"},
                  "coverImage": {
                    "type": "string",
                    "description": "封面图片URL"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "更新成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {"type": "object"}
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": ["文章管理"],
        "summary": "删除文章",
        "description": "删除指定文章",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "文章ID",
            "schema": {"type": "string"}
          }
        ],
        "responses": {
          "200": {
            "description": "删除成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/chat/send": {
      "post": {
        "tags": ["聊天"],
        "summary": "发送聊天消息",
        "description": "发送聊天消息到AI服务",
        "security": [{"bearerAuth": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["message"],
                "properties": {
                  "message": {
                    "type": "string",
                    "description": "消息内容",
                    "minLength": 1,
                    "maxLength": 1000
                  },
                  "userId": {
                    "type": "string",
                    "description": "用户ID（可选）"
                  },
                  "service": {
                    "type": "string",
                    "enum": ["openrouter", "auto"],
                    "description": "服务类型（可选）"
                  },
                  "model": {
                    "type": "string",
                    "description": "模型名称（可选）"
                  },
                  "sessionId": {
                    "type": "string",
                    "description": "会话ID（可选）"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "发送成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {
                      "type": "object",
                      "properties": {
                        "response": {
                          "type": "string",
                          "description": "AI回复内容"
                        },
                        "sessionId": {
                          "type": "string",
                          "description": "会话ID"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/chat/history": {
      "get": {
        "tags": ["聊天"],
        "summary": "获取聊天历史",
        "description": "获取聊天历史记录",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "sessionId",
            "in": "query",
            "description": "会话ID（可选）",
            "schema": {"type": "string"}
          },
          {
            "name": "limit",
            "in": "query",
            "description": "获取数量",
            "schema": {
              "type": "integer",
              "default": 50
            }
          }
        ],
        "responses": {
          "200": {
            "description": "获取成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {
                      "type": "array",
                      "items": {"type": "object"}
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/login-logs": {
      "get": {
        "tags": ["认证"],
        "summary": "获取登录日志",
        "description": "获取用户登录日志列表",
        "security": [{"bearerAuth": []}],
        "parameters": [
          {
            "name": "username",
            "in": "query",
            "description": "用户名（可选）",
            "schema": {"type": "string"}
          },
          {
            "name": "startDate",
            "in": "query",
            "description": "开始日期（可选）",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "endDate",
            "in": "query",
            "description": "结束日期（可选）",
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "name": "status",
            "in": "query",
            "description": "登录状态（可选）",
            "schema": {
              "type": "string",
              "enum": ["success", "failed"]
            }
          },
          {
            "name": "loginSource",
            "in": "query",
            "description": "登录来源（可选）",
            "schema": {
              "type": "string",
              "enum": ["pc", "h5"]
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "页码",
            "schema": {
              "type": "integer",
              "default": 1
            }
          },
          {
            "name": "limit",
            "in": "query",
            "description": "每页数量",
            "schema": {
              "type": "integer",
              "default": 10
            }
          }
        ],
        "responses": {
          "200": {
            "description": "获取成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {"type": "integer"},
                    "message": {"type": "string"},
                    "data": {
                      "type": "object",
                      "properties": {
                        "total": {"type": "integer"},
                        "page": {"type": "integer"},
                        "limit": {"type": "integer"},
                        "list": {
                          "type": "array",
                          "items": {"type": "object"}
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "tags": [
    {
      "name": "认证",
      "description": "用户登录、注册、验证码等认证相关接口"
    },
    {
      "name": "用户管理",
      "description": "用户信息的增删改查操作"
    },
    {
      "name": "角色管理",
      "description": "角色信息的增删改查操作"
    },
    {
      "name": "文章管理",
      "description": "文章内容的增删改查操作"
    },
    {
      "name": "聊天",
      "description": "AI聊天相关接口"
    }
  ]
}

// 生成API文档文件
const outputPath = path.join(process.cwd(), 'api-documentation.json')

try {
  fs.writeFileSync(outputPath, JSON.stringify(apiDocs, null, 2), 'utf8')
  console.log('✅ API文档已生成:', outputPath)
  console.log('📝 您可以将此文件导入到Apifox中使用')
} catch (error) {
  console.error('❌ 生成API文档失败:', error.message)
  process.exit(1)
} 