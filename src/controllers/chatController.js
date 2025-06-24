import localAIChatService from '../services/localAIChat.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

class ChatController {
  // 检查数据库连接状态
  checkConnection = () => {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('数据库未连接');
    }
  }

  // 发送消息（流式）
  sendMessage = async (req, res) => {
    try {
      this.checkConnection();

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '请求参数错误',
          errors: errors.array()
        });
      }

      const { message, context } = req.body;
      const userId = req.user?.id || req.body.userId || 'anonymous';

      console.log(`开始处理用户 ${userId} 的本地 AI 聊天流式请求`);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const stream = localAIChatService.sendMessage(userId, message, context);

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

    } catch (error) {
      console.error('聊天控制器流错误:', error.message);
      // 如果连接尚未关闭，可以尝试发送一个错误事件
      if (!res.writableEnded) {
        const errorPayload = {
          error: true,
          message: error.message || '处理流时发生未知错误'
        };
        res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
      }
    } finally {
      // 确保在任何情况下都关闭连接
      if (!res.writableEnded) {
        res.end();
      }
    }
  }

  // 获取对话历史
  getHistory = async (req, res) => {
    try {
      // 检查数据库连接
      this.checkConnection();

      const userId = req.user?.id || req.query.userId || 'anonymous';
      
      const history = localAIChatService.getHistory(userId);

      // 设置缓存控制头，确保每次都获取最新数据
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      console.error('获取历史记录错误:', error);
      
      if (error.message === '数据库未连接') {
        return res.status(503).json({
          success: false,
          message: '数据库服务暂时不可用，请稍后重试'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '获取历史记录失败'
      });
    }
  }

  // 清除对话历史
  clearHistory = async (req, res) => {
    try {
      // 检查数据库连接
      this.checkConnection();

      const userId = req.user?.id || req.body.userId || 'anonymous';
      
      localAIChatService.clearHistory(userId);

      res.json({
        success: true,
        message: '对话历史已清除'
      });

    } catch (error) {
      console.error('清除历史记录错误:', error);
      
      if (error.message === '数据库未连接') {
        return res.status(503).json({
          success: false,
          message: '数据库服务暂时不可用，请稍后重试'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '清除历史记录失败'
      });
    }
  }
}

export default new ChatController(); 