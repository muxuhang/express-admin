pipeline {
    agent any

    environment {
        DOCKER_BUILDKIT = '1'
        COMPOSE_PROJECT_NAME = 'cacti'
    }

    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['staging', 'production'],
            description: '部署环境'
        )
        string(
            name: 'IMAGE_TAG',
            defaultValue: 'latest',
            description: 'Docker 镜像标签，默认使用 latest'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: '是否跳过测试'
        )
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('检出代码') {
            steps {
                checkout scm
            }
        }

        stage('安装依赖') {
            steps {
                dir('cacti-api') {
                    sh 'npm ci'
                }
            }
        }

        stage('代码检查') {
            when {
                expression { !params.SKIP_TESTS }
            }
            steps {
                dir('cacti-api') {
                    sh 'npm run lint || true'
                }
            }
        }

        stage('构建 Docker 镜像') {
            steps {
                dir('cacti-api') {
                    script {
                        def imageName = "cacti-api:${params.IMAGE_TAG}"
                        sh """
                            docker build -f Dockerfile.prod -t ${imageName} .
                        """
                    }
                }
            }
        }

        stage('推送镜像') {
            when {
                anyOf {
                    expression { env.DOCKER_REGISTRY != null }
                    expression { env.DOCKER_REGISTRY != '' }
                }
            }
            steps {
                dir('cacti-api') {
                    script {
                        def fullImage = "${env.DOCKER_REGISTRY}/cacti-api:${params.IMAGE_TAG}"
                        sh """
                            docker tag cacti-api:${params.IMAGE_TAG} ${fullImage}
                            docker push ${fullImage}
                        """
                    }
                }
            }
        }

        stage('部署') {
            steps {
                dir('cacti-api') {
                    sh '''
                        docker-compose -f docker-compose.prod.yml up -d --build backend
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'cacti-api 部署成功'
            // 可添加钉钉/企业微信通知
        }
        failure {
            echo 'cacti-api 部署失败'
        }
        always {
            cleanWs()
        }
    }
}
