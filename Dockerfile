# 使用Node.js的官方Docker镜像作为基础镜像  
FROM node:18.16.1
  
# 设置工作目录为/app  
WORKDIR /app  
  
# 将当前目录下的所有文件复制到容器的/app目录下  
COPY package*.json ./  
  
# 安装项目依赖  
RUN npm install  
RUN npm rebuild bcrypt 
  
# 复制当前目录下的所有文件（除了.dockerignore中排除的）到容器的/app目录下  
COPY ./views /usr/src/app/views  
  
# 设置容器启动时执行的命令  
EXPOSE 8888  
CMD [ "node", "index.js" ] # 或者你的主文件名