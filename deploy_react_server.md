## 1.安装nginx&jenkins镜像
`docker pull nginx`  
`docker pull jenkins/jenkins:lts`

## 2.创建文件夹
`mkdir /docker`  
`mkdir /docker/compose`  
`mkdir /docker/jenkins_home`  
`mkdir /docker/nginx`  
`mkdir /docker/nginx/conf`  
`mkdir /docker/html`  
`mkdir /docker/html/dev`  

## 3.创建两个文件docker-compose.yml、nginx.conf
  cd /docker/compose && vim docker-compose.yml
  cd /docker/nginx/conf && vim nginx.conf

## 4.docker-compose.yml配置
    version: '3'
    
    networks:
      frontend:
        external: true
    
    services:                                      # 容器
      docker_jenkins:
        user: root                                 # root权限
        restart: always                            # 重启方式
        image: jenkins/jenkins:lts                 # 使用的镜像
        container_name: jenkins                    # 容器名称
          
        ports:                                     # 对外暴露的端口定义
          - 8080:8080
          - 50000:50000
    
        volumes:                                   # 卷挂载路径
          - /docker/jenkins_home/:/var/jenkins_home     # 挂载到容器内的jenkins_home目录
          - /usr/local/bin/docker-compose:/usr/local/bin/docker-compose
    
      docker_nginx_dev:                            # nginx-dev环境 可配置多个镜像
        restart: always
        image: nginx
        container_name: nginx_dev
        ports:
          - 8001:8001
        volumes:
          - /docker/nginx/conf/nginx.conf:/etc/nginx/nginx.conf
          - /docker/html/dev/dist:/docker/html/dev/dist
          - /docker/nginx/logs:/var/log/nginx

## 5.执行docker启动命令
  启动docker`systemctl start docker`  
  进入到对应目录`cd /docker/compose`  
  执行命令`docker-compose up -d`  

## 6.配置jenkins部署步骤
1. 下载nodjs、publish over SSH插件  
2. 设置Build Shell  
    `rm -rf bulid.tar.gz`  
    `rm -rf node_modules`  
    `npm install`  
    `npm run build`  
    `tar -zcvf bulid.tar.gz dist/`  
3. 构建后操作  
    `Source files bulid.tar.gz`  
    `Remote directory /docker/html/dev`  
    `Exec command`  
    `cd /docker/html/dev`  
    `rm -rf dist`  
    `tar -zxvf bulid.tar.gz`  
    `rm -rf bulid.tar.gz`  
    `docker restart nginx_dev 每个环境启动docker镜像不同，分别配置`  
